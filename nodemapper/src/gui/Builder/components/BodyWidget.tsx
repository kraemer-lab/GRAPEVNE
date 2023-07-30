import React from "react";
import styled from "@emotion/styled";

import { keys } from "lodash";
import { NodeModel } from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-diagrams";
import { DiagramEngine } from "@projectstorm/react-diagrams";

import TerminalWindow from "./TerminalWindow";
import BuilderEngine from "../BuilderEngine";
import NodeInfoRenderer from "./NodeInfoRenderer";
import BuilderSettings from "./BuilderSettings";

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
  flex-direction: vertical;
  flex-grow: 1;
`;

const onWidgetDrag_DragOver = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
};

export const BodyWidget = (props: BodyWidgetProps) => {
  const modules = useAppSelector((state) => state.builder.modules_list);
  const terminal_visible = useAppSelector(
    (state) => state.builder.terminal_visibile
  );
  let modules_list = modules; // create a mutable copy

  const [filterSelection, setFilterSelection] = React.useState("");
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
  if (modules_list === undefined) {
    console.log(
      "ALERT: Modules failed to load - check that the repository name is " +
        "correct and is reachable"
    );
    // Need a mechanism to queue messages back to the user (status bar is
    //  overwritten at the end of this render process)
    modules_list = "[]";
  }

  const updateTrayItems = (filter_org: string) =>
    JSON.parse(modules_list)
      .filter((m) => m["name"].startsWith(filter_org) || filter_org === "(all)")
      .map((m) => (
        <TrayItemWidget
          key={m["name"]}
          model={m}
          name={m["name"]}
          color={BuilderEngine.GetModuleTypeColor(m["type"])}
        />
      ));

  const [trayitems, setTrayitems] = React.useState(updateTrayItems("(all)"));
  React.useEffect(() => {
    setFilterSelection("(all)");
    setTrayitems(updateTrayItems("(all)"));
  }, [modules]);

  const onChangeOrgList = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterSelection(event.target.value);
    setTrayitems(updateTrayItems(event.target.value));
  };

  // Extract unique organisations from the module names for a filter list
  const organisaton_list = JSON.parse(modules_list)
    .map((m) => m["name"].match(/\((.*?)\)/)[0]) // extract organisation name
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort(); // sort alphabetically
  organisaton_list.unshift("(all)"); // add "(all)" to the top of the list
  const organisaton_list_options = organisaton_list.map((m) => (
    <option key={m} value={m}>
      {m}
    </option>
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
    <Body>
      <Content>
        <div
          style={{
            background: "rgb(20, 20, 20)",
            overflowY: "auto",
          }}
        >
          <div>
            <select
              name="orglist"
              id="orglist"
              value={filterSelection}
              style={{
                color: "white",
                fontFamily: "Helvetica, Arial",
                padding: "5px",
                margin: "0px 10px",
                border: "solid 1px ${(p) => p.color}",
                borderRadius: "5px",
                marginBottom: "2px",
                marginTop: "2px",
                cursor: "pointer",
                minWidth: "200px",
                background: "rgb(20, 20, 20)",
                flexGrow: "0",
                flexShrink: "0",
                width: "95%",
                boxSizing: "border-box",
              }}
              onChange={onChangeOrgList}
            >
              {organisaton_list_options}
            </select>
          </div>
          <TrayWidget>{trayitems}</TrayWidget>
        </div>
        <Layer onDrop={onWidgetDrag_Drop} onDragOver={onWidgetDrag_DragOver}>
          <GridCanvasWidget>
            <CanvasWidget engine={props.engine} />
          </GridCanvasWidget>
          <div
            style={{
              position: "absolute",
              display: terminal_visible ? "block" : "none",
              bottom: 0,
              width: "100%",
            }}
          >
            <TerminalWindow />
          </div>
        </Layer>
        <NodeInfoRenderer />
        <BuilderSettings />
      </Content>
    </Body>
  );
};
