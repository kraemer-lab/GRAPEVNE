import React from "react";
import { useState } from "react";
import { useCallback } from "react";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";

import ReactFlow from "reactflow";
import { Node } from "reactflow";
import { Edge } from "reactflow";
import { addEdge } from "reactflow";
import { Controls } from "reactflow";
import { Background } from "reactflow";
import { Connection } from "reactflow";
import { NodeChange } from "reactflow";
import { NodeProps } from "reactflow";
import { EdgeChange } from "reactflow";
import { useNodesState } from "reactflow";
import { useEdgesState } from "reactflow";
import { applyNodeChanges } from "reactflow";
import { applyEdgeChanges } from "reactflow";

import { Handle, Position } from "reactflow";

import { builderNodeSelected } from "redux/actions/builder";
import { builderUpdateNodeInfo } from "redux/actions/builder";
import { builderSetNodes } from "redux/actions/builder";
import { builderSetEdges } from "redux/actions/builder";

import "reactflow/dist/style.css";
import styles from "./flow.module.css";

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
  //const [name, setLabel] = useState(props.data?.label ?? "none");

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

// Remember to useMemo if this is moved inside a component
const nodeTypes = {
  standard: ModuleNode,
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
): Node[] =>
  nodes.map((node) => {
    if (node.id === id) {
      const newnode = JSON.parse(JSON.stringify(node));
      newnode.data.config.config = workflow;
      return newnode;
    } else {
      return node;
    }
  });

const Flow = () => {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => state.builder.nodes);
  const edges = useAppSelector((state) => state.builder.edges);

  const onNodesChange = (changes: NodeChange[]) => {
    dispatch(builderSetNodes(applyNodeChanges(changes, nodes)));
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    dispatch(builderSetEdges(applyEdgeChanges(changes, edges)));
  };

  const onConnect = (connection: Connection) => {
    dispatch(builderSetEdges(addEdge(connection, edges)));
  };

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    const payload = {
      id: node.id,
      name: node.data.config.name,
      type: node.data.config.type,
      code: JSON.stringify(node.data.config.config, null, 2),
    };
    dispatch(builderUpdateNodeInfo(JSON.stringify(payload)));
    dispatch(builderNodeSelected());
  };

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    console.log("context menu");
  };

  return (
    <ReactFlow
      nodeTypes={nodeTypes}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onNodeContextMenu={onNodeContextMenu}
      proOptions={proOptions}
      snapToGrid={true}
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};

export default Flow;
