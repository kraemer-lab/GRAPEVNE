import React from "react";
import styled from "@emotion/styled";
import NodeInfo from "./NodeInfo";
import BuilderEngine from "../BuilderEngine";

import { keys } from "lodash";
import { TrayWidget } from "./TrayWidget";
import { CanvasWidget } from "@projectstorm/react-diagrams";
import { DiagramEngine } from "@projectstorm/react-diagrams";
import { useAppSelector } from "redux/store/hooks";
import { TrayItemWidget } from "./TrayItemWidget";
import { DefaultNodeModel } from "NodeMap";
import { GridCanvasWidget } from "./GridCanvasWidget";

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
  const trayitems = JSON.parse(modules).map((m) => (
    <TrayItemWidget
      key={m["name"]}
      model={m}
      name={m["name"]}
      color={BuilderEngine.GetModuleTypeColor(m["type"])}
    />
  ));

  return (
    <>
      <Body>
        <Content>
          <TrayWidget>{trayitems}</TrayWidget>
          <Layer
            onDrop={(event) => {
              const engine = props.engine;
              const data = JSON.parse(
                event.dataTransfer.getData("storm-diagram-node")
              );
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
                input_namespace = Object.keys(
                  data.config.params.input_namespace
                );
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
            }}
            onDragOver={(event) => {
              event.preventDefault();
            }}
          >
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
