import _ from "lodash";
import React from "react";
import styled from "@emotion/styled";
import BuilderEngine from "../BuilderEngine";
import InfoPanel from "./InfoPanel";
import ResizeHandle from "./ResizeHandle";
import TerminalController from "Terminal/TerminalController";

import { NodeModel } from "@projectstorm/react-diagrams";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";
import { DiagramEngine } from "@projectstorm/react-diagrams";
import { builderNodeSelected } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";
import { builderUpdateStatusText } from "redux/actions";
import { Panel } from "react-resizable-panels";
import { PanelGroup } from "react-resizable-panels";
import { GridCanvasWidget } from "./GridCanvasWidget";
import { CanvasWidget } from "@projectstorm/react-diagrams";

import styles from "./styles.module.css";

const builderAPI = window.builderAPI;
type Query = Record<string, unknown>;

interface IPayload {
  id: string;
}

interface CanvasProps {
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

/**
 * Canvas display area for the Builder application.
 *
 * This is the main display area for the Builder application. It contains
 * the workflow graph and the configuration pane.
 *
 * Elements:
 * 1. Canvas (contains the workflow graph)
 * 2. Panel group (tabbed panel group for e.g. log display)
 */
const Canvas = (props: CanvasProps) => {
  const modules = useAppSelector((state) => state.builder.modules_list);
  const repo = JSON.parse(useAppSelector((state) => state.builder.repo));
  const configPaneOpen = useAppSelector(
    (state) => state.builder.config_pane_display
  );

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

  const onWidgetDrag_Drop = (event: React.DragEvent<HTMLDivElement>) => {
    const app = BuilderEngine.Instance;
    const engine = app.engine;
    const data = JSON.parse(event.dataTransfer.getData("storm-diagram-node"));
    const point = engine.getRelativeMousePoint(event);
    const color = BuilderEngine.GetModuleTypeColor(data.type as string);
    // Isolate configuration
    const module_name = data.name as string;
    const workflow = data.config as Query;
    const workflow_config = workflow.config as Query;
    // Check if module was provided with a configuration
    if (_.isEmpty(workflow_config)) {
      // Module was not provided with a configuration - attempt to load now
      dispatch(builderUpdateStatusText(`Loading module ${module_name}...`));
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
          // Extract docstring
          const docstring = config["docstring"];
          delete config["docstring"];
          (data.config as Query).config = config;
          (data.config as Query).docstring = docstring;
          const node = app.AddNodeToGraph(data, point, color);
          // Broadcast new node (cannot call react hooks from non-react functions)
          setNewnode(node);
          dispatch(builderUpdateStatusText(`Module loaded.`));
        })
        .catch((error) => {
          console.log(error);
          dispatch(
            builderUpdateStatusText(`FAILED to load module ${module_name}.`)
          );
        });
    } else {
      // Module already contains a valid configuration
      const node = app.AddNodeToGraph(data, point, color);
      // Broadcast new node (cannot call react hooks from non-react functions)
      setNewnode(node);
    }
  };

  return (
    <Body>
      <Content>
        <Layer onDrop={onWidgetDrag_Drop} onDragOver={onWidgetDrag_DragOver}>
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
              onResize={(size: number, _delta: number) => {
                const term = TerminalController.Instance; // singleton instance
                term.fitAddon.fit();
              }}
            >
              <div className={styles.PanelContent}>
                <InfoPanel />
              </div>
            </Panel>
          </PanelGroup>
        </Layer>
      </Content>
    </Body>
  );
};

export default Canvas;
