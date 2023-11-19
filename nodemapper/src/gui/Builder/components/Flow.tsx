import _ from "lodash";
import React from "react";
import BuilderEngine from "../BuilderEngine";
import { useRef } from "react";
import { useState } from "react";
import { useCallback } from "react";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";

import { builderAddNode } from "redux/actions";
import { builderSetNodes } from "redux/actions";
import { builderSetEdges } from "redux/actions";
import { builderNodeSelected } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";
import { builderUpdateNodeInfo } from "redux/actions";
import { builderUpdateStatusText } from "redux/actions";

import ReactFlow from "reactflow";
import { Node } from "reactflow";
import { Edge } from "reactflow";
import { Handle } from "reactflow";
import { addEdge } from "reactflow";
import { BaseEdge } from "reactflow";
import { Controls } from "reactflow";
import { Position } from "reactflow";
import { NodeProps } from "reactflow";
import { EdgeProps } from "reactflow";
import { Background } from "reactflow";
import { Connection } from "reactflow";
import { NodeChange } from "reactflow";
import { EdgeChange } from "reactflow";
import { getBezierPath } from "reactflow";
import { useNodesState } from "reactflow";
import { useEdgesState } from "reactflow";
import { applyNodeChanges } from "reactflow";
import { applyEdgeChanges } from "reactflow";
import { EdgeLabelRenderer } from "reactflow";

import ContextMenu from "./ContextMenu";

import "reactflow/dist/style.css";
import styles from "./flow.module.css";
import "./flow.css";

const builderAPI = window.builderAPI;
type Query = Record<string, unknown>;

const proOptions = {
  hideAttribution: true,
};

export type ModuleData = {
  // Place graphical only settings here
  color: string;

  // Keep GRAPEVNE module configuration isolated from any graphical settings
  config: {
    name: string;
    type: string;
    config: {
      snakefile: string;
      docstring?: string | null;
      config: {
        input_namespace: string | Record<string, string> | null;
        output_namespace: string | null;
        params?: Record<string, unknown> | null;
      };
    };
  };
};

const ModuleNode = (props: NodeProps<ModuleData>) => {
  // Extract input_namespace and wrap as list as necessary
  const input_namespace =
    props.data?.config?.config?.config.input_namespace ?? null;
  let input_namespaces: string[];
  let named_inputs = false;
  if (typeof input_namespace === "string") {
    input_namespaces = [input_namespace];
  } else if (input_namespace === null) {
    input_namespaces = [];
  } else {
    named_inputs = true;
    input_namespaces = Object.keys(input_namespace);
  }

  return (
    <div
      className={styles.Node}
      style={{
        backgroundColor: props.data.color,
      }}
    >
      <div className={styles.HeaderPanel}>
        <div className={styles.HeaderText}>{props.data.config.name}</div>
      </div>
      {!named_inputs ? (
        <>
          {input_namespaces.length == 1 ? (
            <Handle
              className={styles.HandleInput}
              id={input_namespaces[0]}
              key={input_namespaces[0]}
              type="target"
              position={Position.Left}
              style={{ top: "50%" }}
            />
          ) : null}
          <Handle
            className={styles.HandleOutput}
            id="out"
            type="source"
            position={Position.Right}
            style={{ top: "50%" }}
          />
        </>
      ) : (
        <div
          className={styles.BodyPanel}
          style={{
            height: `${input_namespaces.length * 18 - 4}px`,
          }}
        >
          {input_namespaces.map((name) => (
            <div key={"div-" + name}>
              <Handle
                className={styles.HandleInput}
                id={name}
                key={name}
                type="target"
                position={Position.Left}
                style={{ top: `${input_namespaces.indexOf(name) * 18 + 38}px` }}
                onClick={(event) => {
                  event.stopPropagation();
                  console.log("Input handle clicked: ", event.target);
                }}
              >
                <div className={styles.InputPortLabel}>{name}</div>
              </Handle>
            </div>
          ))}
          <Handle
            className={styles.HandleOutput}
            id="out"
            type="source"
            position={Position.Right}
            style={{
              top: `${((input_namespaces.length - 1) / 2) * 18 + 38}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};

const onEdgeClick = (evt, id) => {
  evt.stopPropagation();
  alert(`Edge button selected ${id}`);
};

export const ButtonEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <button
            className={styles.ButtonEdge}
            onClick={(event) => onEdgeClick(event, id)}
          >
            -
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Remember to useMemo if this is moved inside a component
const nodeTypes = {
  standard: ModuleNode,
};

const edgeTypes = {
  buttonedge: ButtonEdge,
};

export const getNodeById = (id: string, nodes: Node[]): Node | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
  }
  return null;
};

export const setNodeName = (nodes: Node[], id: string, name: string): Node[] =>
  nodes.map((node) => {
    if (node.id === id) {
      const newnode = JSON.parse(JSON.stringify(node));
      newnode.data.config.name = name;
      return newnode;
    } else {
      return node;
    }
  });

export const setNodeWorkflow = (
  nodes: Node[],
  id: string,
  workflow: Record<string, unknown>
): Node[] => {
  return nodes.map((node) => {
    if (node.id === id) {
      const newnode = JSON.parse(JSON.stringify(node));
      newnode.data.config.config = workflow;
      return newnode;
    } else {
      return node;
    }
  });
};

const Flow = () => {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => state.builder.nodes);
  const edges = useAppSelector((state) => state.builder.edges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [menu, setMenu] = useState(null);
  const ref = useRef(null);

  const onNodesChange = (changes: NodeChange[]) => {
    dispatch(builderSetNodes(applyNodeChanges(changes, nodes)));
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    dispatch(builderSetEdges(applyEdgeChanges(changes, edges)));
  };

  const onConnect = (connection: Connection) => {
    dispatch(
      builderSetEdges(addEdge({ ...connection, type: "buttonedge" }, edges))
    );
  };

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    const payload = {
      id: node.id,
      name: node.data.config.name,
      type: node.data.config.type,
      code: JSON.stringify(node.data.config.config, null, 2),
    };
    // Close context menu (if open)
    setMenu(null);
    // Open module parameters pane
    dispatch(builderUpdateNodeInfo(JSON.stringify(payload)));
    dispatch(builderNodeSelected());
  };

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    // Prevent native context menu from showing
    event.preventDefault();
    // Close module parameters pane (if open)
    dispatch(builderNodeDeselected());
    // Open context menu
    const pane = ref.current.getBoundingClientRect();
    // Position context menu; right-align if it is too close to the edge of the pane
    setMenu({
      id: node.id,
      top:
        event.clientY - pane.top < pane.height - 200 &&
        event.clientY - pane.top,
      bottom:
        event.clientY - pane.top >= pane.height - 200 &&
        pane.height - (event.clientY - pane.top),
      left:
        event.clientX - pane.left < pane.width - 200 &&
        event.clientX - pane.left,
      right:
        event.clientX - pane.left >= pane.width - 200 &&
        pane.width - (event.clientX - pane.left),
    });
  };

  const onPaneClick = useCallback(() => {
    console.log("Pane clicked");
    // Close context menu (if open)
    setMenu(null);
    // Close module parameters pane (if open)
    dispatch(builderNodeDeselected());
  }, [setMenu]);

  const onDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("flow-diagram-node");
    // check if the dropped element is valid
    if (typeof type === "undefined" || !type) {
      return;
    }
    const app = BuilderEngine.Instance;
    const data = JSON.parse(event.dataTransfer.getData("flow-diagram-node"));
    const point = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const color = BuilderEngine.GetModuleTypeColor(data.type as string);
    // Isolate configuration
    const module_name = data.name as string;
    const workflow = data.config as Query;
    const workflow_config = workflow.config as Query;
    // Check if module was provided with a configuration
    if (_.isEmpty(workflow_config)) {
      // Module was not provided with a configuration - attempt to load now
      dispatch(builderUpdateStatusText(`Loading module ${module_name}...`));
      // Get repository details from module
      const repo = {};
      if (typeof workflow["snakefile"] === "string") {
        repo["type"] = "local";
        repo["repo"] = workflow["snakefile"];
      } else {
        // TODO: Assumes github directory listing (not compatible with branch listing)
        repo["type"] = "github";
        repo["repo"] = workflow["snakefile"]["args"][0];
      }
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
          // Add node to graph
          const newnode = {
            id: app.getUniqueID(nodes),
            type: "standard",
            data: {
              color: color,
              config: {
                ...data,
                name: app.EnsureUniqueName(module_name, nodes),
              },
            },
            position: point,
          } as Node;
          // Add node to graph
          dispatch(builderAddNode(newnode));
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
      const newnode = {
        id: app.getUniqueID(nodes),
        type: "standard",
        data: {
          config: { ...data, name: app.EnsureUniqueName(module_name, nodes) },
        },
        position: point,
      } as Node;
      dispatch(builderAddNode(newnode));
    }
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  return (
    <ReactFlow
      ref={ref}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodes={nodes}
      edges={edges}
      onInit={setReactFlowInstance}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onNodeContextMenu={onNodeContextMenu}
      onPaneClick={onPaneClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      proOptions={proOptions}
      snapToGrid={true}
    >
      <Controls />
      <Background />
      {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
    </ReactFlow>
  );
};

export default Flow;
