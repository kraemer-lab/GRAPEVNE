import _ from "lodash";
import React from "react";
import styled from "@emotion/styled";

import { keys } from "lodash";
import { NodeModel } from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-diagrams";
import { DiagramEngine } from "@projectstorm/react-diagrams";

import BuilderEngine from "../BuilderEngine";
import InfoPanel from "./InfoPanel";
import ConfigPane from "./ConfigPane";

import ResizeHandle from "./ResizeHandle";
import { Panel } from "react-resizable-panels";
import { PanelGroup } from "react-resizable-panels";
import styles from "./styles.module.css";

import { TrayWidget } from "./TrayWidget";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { TrayItemWidget } from "./TrayItemWidget";
import { DefaultNodeModel } from "NodeMap";
import { GridCanvasWidget } from "./GridCanvasWidget";
import { builderNodeSelected } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";

// TODO
// This line permits any function declarations from the window.builderAPI
// as a workaround. Remove this in favour of a proper typescript-compatible
// interface. This may require modification to the electron code.
declare const window: any;
const builderAPI = window.builderAPI;

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
  const repo = JSON.parse(useAppSelector((state) => state.builder.repo));
  let modules_list = modules; // create a mutable copy
  const configPaneOpen = useAppSelector((state) => state.builder.config_pane_open);

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
        entityRemoved: (e) => {
          dispatch(builderNodeDeselected({}));
        },
      });
      setNewnode(null);
    }
  }, [newnode]);

  // Check for a valid module list
  if (modules_list === undefined) {
    console.debug(
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

    // Read workflow configuration if not provided
    const workflow = app.nodeScene.getNodeWorkflow(node);
    const workflow_config = workflow.config as Record<string, unknown>;
    console.log("workflow_config: " + workflow_config);
    for (const [key, value] of Object.entries(workflow_config)) {
      console.log(key, value);
    }
    if (_.isEmpty(workflow_config)) {
      workflow["config"] = { msg: "Configuration loading... refresh to view." };
      app.nodeScene.setNodeWorkflow(node, workflow);
      console.log(
        `No configuration found for module ${workflow["name"]}, attemping to load...`
      );
      const query: Record<string, unknown> = {
        query: "builder/get-remote-module-config",
        data: {
          format: "Snakefile",
          content: {
            repo: repo,
            snakefile: workflow["snakefile"],
          },
        },
      };
      const getConfig = async (query) => {
        return await builderAPI.GetRemoteModuleConfig(query);
      };
      getConfig(query)
        .then((config) => {
          workflow["config"] = config;
          app.nodeScene.setNodeWorkflow(node, workflow);
        })
        .catch((error) => {
          console.log(error);
          workflow["config"] = { msg: "Configuration FAILED to load." };
          app.nodeScene.setNodeWorkflow(node, workflow);
        });
    }
  };

  return (
    <div className={styles.Container}>
      <Body>
        <Content>
          <PanelGroup direction="horizontal">
            <Panel
              className={styles.Panel}
              order={1}
              defaultSize={20}
            >
              <div
                className={styles.PanelContent}
                style={{
                  overflowY: "auto",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignSelf: "flex-start",
                }}
              >
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
                    width: "100%",
                    background: "var(--background-color)",
                    flexGrow: "0",
                    flexShrink: "0",
                    boxSizing: "border-box",
                  }}
                  onChange={onChangeOrgList}
                >
                  {organisaton_list_options}
                </select>
                <TrayWidget>{trayitems}</TrayWidget>
              </div>
            </Panel>
            <ResizeHandle />

            <Panel
              className={styles.Panel}
              order={2}
              defaultSize={configPaneOpen ? 60 : 80}
            >
              <div className={styles.BottomRow}>
                <Body>
                  <Content>
                    <Layer
                      onDrop={onWidgetDrag_Drop}
                      onDragOver={onWidgetDrag_DragOver}
                    >
                      <PanelGroup direction="vertical">
                        <Panel className={styles.Panel} defaultSize={70}>
                          <GridCanvasWidget>
                            <CanvasWidget engine={props.engine} />
                          </GridCanvasWidget>
                        </Panel>
                        <ResizeHandle />
                        <Panel
                          className={styles.Panel}
                          defaultSize={30}
                          collapsible={true}
                        >
                          <div className={styles.PanelContent}>
                            <InfoPanel />
                          </div>
                        </Panel>
                      </PanelGroup>
                    </Layer>
                  </Content>
                </Body>
              </div>
            </Panel>

            { (configPaneOpen) ? (
              <>
              <ResizeHandle />
              <Panel
                className={styles.Panel}
                order={3}
                defaultSize={20}
                collapsible={true}
              >
                <div className={styles.PanelContent}>
                  <ConfigPane />
                </div>
              </Panel>
            </>
            ) : <></> }
          </PanelGroup>
        </Content>
      </Body>
    </div>
  );
};
