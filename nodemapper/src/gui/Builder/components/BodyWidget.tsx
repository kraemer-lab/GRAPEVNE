import React from "react";
import styled from "@emotion/styled";
import NodeInfo from "./NodeInfo";
import BuilderEngine from "../BuilderEngine";

import { keys } from "lodash";
import { NodeModel } from "@projectstorm/react-diagrams";
import { TrayWidget } from "./TrayWidget";
import { CanvasWidget } from "@projectstorm/react-diagrams";
import { DiagramEngine } from "@projectstorm/react-diagrams";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { TrayItemWidget } from "./TrayItemWidget";
import { DefaultNodeModel } from "NodeMap";
import { GridCanvasWidget } from "./GridCanvasWidget";
import { builderNodeSelected } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";

interface IPayload {
  id: string;
}

interface BodyWidgetProps {
  engine: DiagramEngine;
}

const Body = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  height: 100%;
`;

const Layer = styled.div`
  position: relative;
  flex-grow: 1;
`;

export const BodyWidget = (props: BodyWidgetProps) => {
  const modules = useAppSelector((state) => state.builder.modules_list);
  const [newnode, setNewnode] = React.useState<NodeModel>(null);
  const dispatch = useAppDispatch();

  const trayitems = JSON.parse(modules).map((m) => (
    <TrayItemWidget
      key={m["name"]}
      model={m}
      name={m["name"]}
      color={BuilderEngine.GetModuleTypeColor(m["type"])}
    />
  ));

  const onWidgetDrag_Drop = (event: React.DragEvent<HTMLDivElement>) => {
    const engine = props.engine;
    const data = JSON.parse(event.dataTransfer.getData("storm-diagram-node"));
    const nodesCount = keys(engine.getModel().getNodes()).length;

    let node: DefaultNodeModel = null;
    const node_name = data.name + (nodesCount + 1);
    node = new DefaultNodeModel(
      node_name,
      BuilderEngine.GetModuleTypeColor(data.type),
      JSON.stringify({
        id: "idcode", // TODO
        name: node_name,
        type: data.type,
        config: data.config,
      })
    );
    // Determine number (and names of input ports)
    let input_namespace = {};
    if (data.config.params.input_namespace === undefined) {
      // No input namespace specified - use default unless source
      if (data.type !== "source") {
        input_namespace["In"] = "In";
      }
    } else if (typeof data.config.params.input_namespace === "object") {
      // Where the input namespace is an object (probably a dictionary)
      input_namespace = Object.keys(data.config.params.input_namespace);
    } else {
      // Where the input namespace is not an object (probably a string)
      input_namespace["In"] = "In";
    }
    // Add input ports
    for (const key in input_namespace) {
      node.addInPort(input_namespace[key]);
    }
    // Add output port (if applicable)
    switch (data.type) {
      case "source":
      case "module":
      case "connector":
        node.addOutPort("Out");
        break;
    }
    const point = engine.getRelativeMousePoint(event);
    node.setPosition(point);
    engine.getModel().addNode(node);
    engine.repaintCanvas();
    // Broadcast new node (cannot call react hooks from non-react functions)
    setNewnode(node);
  };

  const onWidgetDrag_DragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Register listener for new node
  React.useEffect(() => {
    if (newnode) {
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
      setNewnode(null);
    }
  }, [newnode]);

  const NodeInfoRenderer = (props) => {
    const nodeinfo = useAppSelector((state) => state.display.nodeinfo);
    if (nodeinfo) {
      return (
        <div
          style={{
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
            }}
          >
            Node Info
          </div>
          <div style={{ flex: "1 1 auto" }}>
            <NodeInfo />
          </div>
        </div>
      );
    } else {
      return <></>;
    }
  };

  return (
    <>
      <Body>
        <Content>
          <TrayWidget>{trayitems}</TrayWidget>
          <Layer onDrop={onWidgetDrag_Drop} onDragOver={onWidgetDrag_DragOver}>
            <GridCanvasWidget>
              <CanvasWidget engine={props.engine} />
            </GridCanvasWidget>
          </Layer>
          <NodeInfoRenderer />
        </Content>
      </Body>
    </>
  );
};
