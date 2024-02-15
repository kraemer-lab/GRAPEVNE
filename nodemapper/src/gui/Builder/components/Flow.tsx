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
import { builderUpdateNode } from "redux/actions";
import { builderNodeSelected } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";
import { builderUpdateNodeInfo } from "redux/actions";
import { builderUpdateStatusText } from "redux/actions";

import { Node } from "NodeMap/scene/Flow"; // Custom Node definition
import { Edge } from "NodeMap/scene/Flow"; // Custom Edge definition
import { NodeData } from "NodeMap/scene/Flow"; // Custom NodeData definition

import ReactFlow from "reactflow";
import { Panel } from "reactflow";
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
import { NodeResizeControl } from "reactflow";
import { ResizeControlVariant } from "reactflow";

import ContextMenu from "./ContextMenu";

import "reactflow/dist/style.css";
import styles from "./flow.module.css";
import "./flow.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLeftRight } from "@fortawesome/free-solid-svg-icons";

import dagre from "dagre";

const nodeResizeControlStyle = {
  background: "transparent",
  border: "none",
  width: "98%",
  color: "white",
};

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB",
) => {
  const nodeWidth = 172;
  const nodeHeight = 36;

  // Allow dagre to determine layout
  const isHorizontal = direction === "LR";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);

  // Assign calculated positions to nodes
  const newnodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newnode = JSON.parse(JSON.stringify(node));
    newnode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return newnode;
  });

  return newnodes;
};

const builderAPI = window.builderAPI;
type Query = Record<string, unknown>;

const proOptions = {
  hideAttribution: true,
};

export const wranglename = (name: string) => {
  return name
    .replace(/ /g, "_")
    .replace(/\(/g, "_")
    .replace(/\)/g, "_")
    .toLowerCase();
};

const ModuleNode = (props: NodeProps<NodeData>) => {
  const nodeinfo = useAppSelector((state) => state.builder.nodeinfo);
  let selected = false;
  if (nodeinfo) {
    const nodeinfo_id = JSON.parse(nodeinfo)["id"];
    selected = nodeinfo_id === props.id;
  }

  // Extract input_namespace and wrap as list as necessary
  const node_config = props.data?.config?.config?.config ?? null;
  const input_namespace = node_config.input_namespace ?? null;
  let input_namespaces: string[];
  let named_inputs = false;
  if (typeof input_namespace === "string") {
    // Only display if input_namespace does not start with '_'
    if (input_namespace.startsWith("_")) {
      input_namespaces = [];
    } else {
      input_namespaces = [input_namespace];
    }
  } else if (input_namespace === null) {
    input_namespaces = [];
  } else {
    named_inputs = true;
    input_namespaces = Object.keys(input_namespace);
    // Remove input_namespaces where input_namespace value starts with '_'
    input_namespaces = input_namespaces.filter((name) => {
      return !input_namespace[name].startsWith("_");
    });
  }

  return (
    <>
      <div
        className={styles.Node}
        style={{
          backgroundColor: props.data.color,
        }}
      >
        {selected ? (
          <NodeResizeControl
            style={nodeResizeControlStyle}
            minWidth={120}
            minHeight={50}
            variant={ResizeControlVariant.Line}
            position="top-right"
            shouldResize={(e, params) => params.direction[1] === 0}
          >
            <span
              style={{
                float: "right",
                color: "#bebebe",
              }}
            >
              <FontAwesomeIcon icon={faLeftRight} />
            </span>
          </NodeResizeControl>
        ) : null}
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
            {input_namespaces.map((name) => {
              // Format port name
              const port_name_split = name.split("$");
              let port_name = node_config[port_name_split[0]]?.name ?? null;
              if (!port_name) {
                port_name = name;
              } else if (
                port_name_split.length > 1 &&
                port_name_split[1] !== ""
              ) {
                port_name = port_name + " [" + name.split("$")[1] + "]";
              }

              return (
                <div key={"div-" + name}>
                  <Handle
                    className={styles.HandleInput}
                    id={name}
                    key={name}
                    type="target"
                    position={Position.Left}
                    style={{
                      top: `${input_namespaces.indexOf(name) * 18 + 38}px`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      console.debug("Input handle clicked: ", event.target);
                    }}
                  ></Handle>
                  <div
                    className={styles.InputPortLabel}
                    style={{
                      pointerEvents: "none", // pass-through click events
                      top: `${input_namespaces.indexOf(name) * 18 + 32}px`,
                    }}
                  >
                    {port_name}
                  </div>
                </div>
              );
            })}
            <div>
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
          </div>
        )}
      </div>
    </>
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
          {/*<button
            className={styles.ButtonEdge}
            onClick={(event) => onEdgeClick(event, id)}
          >
            -
          </button>*/}
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

export const getNodeName = (node: Node): string => {
  return node.data.config.name;
};

export const getNodeByName = (name: string, nodes: Node[]): Node | null => {
  for (const node of nodes) {
    console.log("Checking node: ", node.data.config.name, " for ", name);
    if (node.data.config.name === name) {
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
  workflow: Record<string, unknown>,
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
    // Allow node removal to be handled by onNodesDelete
    if (changes.some((change) => change.type === "remove")) {
      return;
    }
    // Otherwise, apply changes to nodes
    dispatch(builderSetNodes(applyNodeChanges(changes, nodes)));
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    dispatch(builderSetEdges(applyEdgeChanges(changes, edges)));
  };

  const onConnect = (connection: Connection) => {
    dispatch(
      builderSetEdges(addEdge({ ...connection, type: "buttonedge" }, edges)),
    );
  };

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setMenu(null); // Close context menu (if open)
    dispatch(builderNodeSelected(node));
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

  const RemoveLinkParameters = (removed_nodes: Node[]) => {
    const removed_nodes_names = removed_nodes.map(getNodeName);
    const StripLinks = (config: Record<string, unknown>) => {
      if (config === null || config === undefined) {
        return config;
      }
      const keys = Object.keys(config);
      for (const key of keys) {
        if (key.startsWith(":")) {
          const metadata = config[key] as Record<string, unknown>;
          const link = metadata["link"] as string[];
          if (link === undefined || link === null) {
            continue;
          }
          if (removed_nodes_names.includes(link[0])) {
            delete metadata["link"];
            if (Object.keys(metadata).length === 0) {
              delete config[key];
            }
          }
        } else if (typeof config[key] === "object") {
          config[key] = StripLinks(config[key] as Record<string, unknown>);
        }
      }
      return config;
    };

    const remaining_nodes = nodes
      .filter((node) => {
        return !removed_nodes.map((n) => n.id).includes(node.id);
      })
      .map((node) => {
        const newnode = JSON.parse(JSON.stringify(node));
        const node_config = newnode.data.config.config.config ?? null;
        if (!node_config) {
          return node_config;
        }
        // Recursively remove links to removed nodes
        const new_node_config = StripLinks(node_config);
        newnode.data.config.config.config = new_node_config;
        return newnode;
      });
    dispatch(builderSetNodes(remaining_nodes));
  };

  const onNodesDelete = (removed_nodes: Node[]) => {
    // Strip any active links to the removed nodes
    RemoveLinkParameters(removed_nodes);
    // Close module parameters pane (if open)
    dispatch(builderNodeDeselected());
    console.log("Removed nodes: ", removed_nodes);
  };

  const onPaneClick = useCallback(() => {
    console.debug("Pane clicked");
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
            id: app.getUniqueNodeID(nodes),
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
          console.error(error);
          dispatch(
            builderUpdateStatusText(`FAILED to load module ${module_name}.`),
          );
        });
    } else {
      // Module already contains a valid configuration
      const newnode = {
        id: app.getUniqueNodeID(nodes),
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

  const onLayout = useCallback(
    (direction) => {
      const newnodes = getLayoutedElements(nodes, edges, direction);
      dispatch(builderSetNodes(newnodes));
    },
    [nodes, edges],
  );

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
      onNodesDelete={onNodesDelete}
      onPaneClick={onPaneClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      proOptions={proOptions}
      snapToGrid={true}
    >
      <Controls />
      <Background />
      <Panel position="top-right">
        <button id="buttonReactflowArrange" onClick={() => onLayout("LR")}>
          Arrange
        </button>
      </Panel>
      {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
    </ReactFlow>
  );
};

export { Node, Edge } from "NodeMap/scene/Flow";
export default Flow;
