import React from "react";
import NodeInfo from "./NodeInfo";
import BuilderEngine from "../BuilderEngine";
import { NodeModel } from "@projectstorm/react-diagrams";
import { DefaultNodeModel } from "NodeMap";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { builderNodeSelected } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";

interface IPayload {
  id: string;
}

interface ExpandProps {
  nodeinfo: Record<string, unknown>;
}

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

const NodeInfoRenderer = (props) => {
  const nodeinfo = useAppSelector((state) => state.builder.nodeinfo);
  if (nodeinfo) {
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
          <div>Node Info</div>
          <div>
            <ExpandButton nodeinfo={JSON.parse(nodeinfo)} />
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
  } else {
    return <></>;
  }
};

export default NodeInfoRenderer;
