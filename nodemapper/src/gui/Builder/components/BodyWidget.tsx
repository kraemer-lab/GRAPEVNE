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

export interface BodyWidgetProps {
  engine: DiagramEngine;
}

export const Body = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  height: 1000px;
`;

export const Content = styled.div`
  display: flex;
  flex-grow: 1;
`;

export const Layer = styled.div`
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
    try {
      input_namespace = Object.keys(data.config.params.input_namespace);
    } catch (e: unknown) {
      switch (data.type) {
        case "module":
        case "connector":
        case "terminal":
          input_namespace["In"] = "In";
          break;
      }
    }
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
          console.log(e.isSelected);
          if (e.isSelected) {
            dispatch(builderNodeSelected(payload));
          } else {
            dispatch(builderNodeSelected(payload));
          }
        },
      });
      setNewnode(null);
    }
  }, [newnode]);

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
        </Content>
      </Body>
      <NodeInfo />
    </>
  );
};
