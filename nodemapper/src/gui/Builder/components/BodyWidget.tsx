import React from "react";
import styled from "@emotion/styled";
import { NodeModel } from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-diagrams";
import { DiagramEngine } from "@projectstorm/react-diagrams";

import NodeInfoRenderer from "./NodeInfoRenderer";
import BuilderEngine from "../BuilderEngine";

import { keys } from "lodash";
import { TrayWidget } from "./TrayWidget";
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
  overflow: clip;
`;

const Layer = styled.div`
  position: relative;
  flex-grow: 1;
`;

const onWidgetDrag_DragOver = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
};

export const BodyWidget = (props: BodyWidgetProps) => {
  let modules = useAppSelector((state) => state.builder.modules_list);
  const [newnode, setNewnode] = React.useState<NodeModel>(null);
  const dispatch = useAppDispatch();
  
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

  // Check for a valid module list
  if (modules === undefined) {
    console.log("ALERT: Modules failed to load - check that the repository name is correct and is reachable");
    // Need a mechanism to queue messages back to the user (status bar is
    //  overwritten at the end of this render process)
    modules = "[]";
  }

  const trayitems = JSON.parse(modules).map((m) => (
    <TrayItemWidget
      key={m["name"]}
      model={m}
      name={m["name"]}
      color={BuilderEngine.GetModuleTypeColor(m["type"])}
    />
  ));

  const onWidgetDrag_Drop = (event: React.DragEvent<HTMLDivElement>) => {
    const app = BuilderEngine.Instance;
    const engine = app.engine;
    const data = JSON.parse(event.dataTransfer.getData("storm-diagram-node"));
    const point = engine.getRelativeMousePoint(event);
    const color = BuilderEngine.GetModuleTypeColor(data.type as string);
    const node = app.AddNodeToGraph(data, point, color);
    // Broadcast new node (cannot call react hooks from non-react functions)
    setNewnode(node);
  };

  return (
    <>
      <Body>
        <Content>
          <div style={{ background: "rgb(20, 20, 20)", overflowY: "auto" }}>
            <TrayWidget>{trayitems}</TrayWidget>
          </div>
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
