import React from "react";
import NodeInfo from "./NodeInfo";
import EasyEdit from "react-easy-edit";
import BuilderEngine from "../BuilderEngine";

import { Types } from "react-easy-edit";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { builderSetNodes } from "redux/actions";
import { builderSetEdges } from "redux/actions";
import { builderNodeSelected } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";
import { builderUpdateNodeInfoName } from "redux/actions";
import { builderCheckNodeDependencies } from "redux/actions";

import { Node, Edge } from "reactflow";

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
    <button id="btnBuilderValidate" className="btn" onClick={btnValidate}>
      Validate
    </button>
  );
};

const ExpandButton = (props: ExpandProps) => {
  const [newnodes, setNewNodes] = React.useState({
    nodes: [] as Node[],
    edges: [] as Edge[],
  });
  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => state.builder.nodes);
  const edges = useAppSelector((state) => state.builder.edges);

  const showExpand = useAppSelector(
    (state) => state.builder.can_selected_expand
  );

  const btnExpand = () => {
    // Expand the selected node into it's constituent modules
    const app = BuilderEngine.Instance;
    const [nodes0, edges0] = app.ExpandNodeByName(
      props.nodeinfo.name as string,
      nodes,
      edges
    );
    console.log("newnodes", newnodes);
    if (nodes0 !== null && nodes0 !== undefined)
      setNewNodes({ nodes: nodes0, edges: edges0 });
  };

  React.useEffect(() => {
    if (newnodes.nodes.length > 0) {
      // Ensure the expanded node is deselected (and no longer editable)
      dispatch(builderSetNodes(newnodes.nodes));
      dispatch(builderSetEdges(newnodes.edges));
      dispatch(builderNodeDeselected());
    }
  }, [newnodes]);

  if (showExpand) {
    return (
      <button id="btnBuilderExpand" className="btn" onClick={btnExpand}>
        Expand
      </button>
    );
  } else {
    return <></>;
  }
};

const PermitNodeExpand = (nodeinfo: Record<string, unknown>, nodes) => {
  const app = BuilderEngine.Instance;
  return app.CanNodeExpand(nodeinfo.name as string, nodes);
};

const NodeInfoRenderer = (props) => {
  const dispatch = useAppDispatch();
  const nodeinfoStr = useAppSelector((state) => state.builder.nodeinfo);
  const nodes = useAppSelector((state) => state.builder.nodes);

  const SetNodeName = (name: string) => {
    if (name) dispatch(builderUpdateNodeInfoName(name));
  };

  if (!nodeinfoStr) return <></>;
  const nodeinfo = JSON.parse(nodeinfoStr);
  if (Object.keys(nodeinfo).length === 0) return <></>;

  // Get node to lock/unlock it during text edits
  const app = BuilderEngine.Instance;
  const node = app.getNodeByName(nodeinfo.name as string, nodes);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexFlow: "column",
      }}
    >
      <div
        style={{
          borderStyle: "solid",
          borderWidth: "1px 0px 0px 0px",
          flex: "0 0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <EasyEdit
            type={Types.TEXT}
            onHoverCssClass="easyedit-hover"
            value={nodeinfo.name}
            saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
            cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
            onSave={(value) => {
              SetNodeName(value);
            }}
            saveOnBlur={true}
          />
        </div>
        <div>
          <ValidateButton nodename={nodeinfo.name} />
          {PermitNodeExpand(nodeinfo, nodes) ? (
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
