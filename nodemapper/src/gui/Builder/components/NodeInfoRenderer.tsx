import React from "react";
import NodeInfo from "./NodeInfo";
import EasyEdit from "react-easy-edit";
import BuilderEngine from "../BuilderEngine";

import { Types } from "react-easy-edit";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { NodeModel } from "@projectstorm/react-diagrams";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DefaultNodeModel } from "NodeMap";
import { builderNodeSelected } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";
import { builderUpdateNodeInfoName } from "redux/actions";
import { builderCheckNodeDependencies } from "redux/actions";

interface IPayload {
  id: string;
}

interface ExpandProps {
  nodeinfo: Record<string, unknown>;
}

interface ValidateButtonProps {
  nodename: string;
}

const ValidateButton = (props: ValidateButtonProps) => {
  const dispatch = useAppDispatch();

  const btnValidate = () => {
    dispatch(builderCheckNodeDependencies(props.nodename));
  };

  return (
    <button className="btn" onClick={btnValidate}>
      Validate
    </button>
  );
};

const ExpandButton = (props: ExpandProps) => {
  const [newnodes, setNewNodes] = React.useState<NodeModel[]>(null);
  const dispatch = useAppDispatch();

  const showExpand = useAppSelector(
    (state) => state.builder.can_selected_expand
  );

  const btnExpand = () => {
    // Expand the selected node into it's constituent modules
    const app = BuilderEngine.Instance;
    const engine = app.engine;
    const newnodes = app.ExpandNodeByName(props.nodeinfo.name as string);
    setNewNodes(newnodes);
  };

  React.useEffect(() => {
    if (newnodes) {
      // Add event listeners
      newnodes.forEach((newnode) => {
        newnode.registerListener({
          selectionChanged: (e) => {
            const payload: IPayload = {
              id: newnode.getOptions().id,
            };
            if (e.isSelected) {
              dispatch(builderNodeSelected(payload));
            } else {
              dispatch(builderNodeDeselected(payload));
            }
          },
        });
      });
      // Ensure the expanded node is deselected (and no longer editable)
      dispatch(builderNodeDeselected(""));
    }
  }, [newnodes]);

  if (showExpand) {
    return (
      <button className="btn" onClick={btnExpand}>
        Expand
      </button>
    );
  } else {
    return <></>;
  }
};

const PermitNodeExpand = (nodeinfo: Record<string, unknown>) => {
  const app = BuilderEngine.Instance;
  return app.CanNodeExpand(nodeinfo.name as string);
};

const NodeInfoRenderer = (props) => {
  const dispatch = useAppDispatch();
  const nodeinfoStr = useAppSelector((state) => state.builder.nodeinfo);

  const SetNodeName = (name: string) => {
    if (name) dispatch(builderUpdateNodeInfoName(name));
  };

  if (!nodeinfoStr) return <></>;
  const nodeinfo = JSON.parse(nodeinfoStr);
  if (Object.keys(nodeinfo).length === 0) return <></>;

  return (
    <div
      style={{
        background: "#333333",
        display: "flex",
        width: "33%",
        height: "100%",
        flexFlow: "column",
      }}
    >
      <div
        style={{
          borderStyle: "solid",
          borderWidth: "1px 0px 1px 0px",
          borderColor: "#666666",
          backgroundColor: "#333333",
          color: "#dddddd",
          flex: "0 0 auto",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <EasyEdit
            type={Types.TEXT}
            onHoverCssClass="easyEditHover"
            value={nodeinfo.name}
            saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
            cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
            onSave={(value) => {
              SetNodeName(value);
            }}
          />
        </div>
        <div>
          <ValidateButton nodename={nodeinfo.name} />
          {PermitNodeExpand(nodeinfo) ? (
            <ExpandButton nodeinfo={nodeinfo} />
          ) : null}
        </div>
      </div>
      <div
        style={{
          flex: "1 1 auto",
          overflowY: "auto",
        }}
      >
        <NodeInfo />
      </div>
    </div>
  );
};

export default NodeInfoRenderer;
