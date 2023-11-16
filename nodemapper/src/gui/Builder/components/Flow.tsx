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
  // Place graphical settings here
  //

  // Keep GRAPEVNE module configuration isolated from any graphical settings
  config: {
    name: string;
    type: string;
    snakefile: string | Record<string, string>;
    docstring?: string | null;
    parameter_map: Record<string, string[]>[];
    config: {
      input_namespace: string | Record<string, string> | null;
      output_namespace: string | null;
      params?: Record<string, unknown> | null;
    };
  };
};

const ModuleNode = (props: NodeProps<ModuleData>) => {
  //const [name, setLabel] = useState(props.data?.label ?? "none");

  // Extract input_namespace and wrap as list as necessary
  const input_namespace = props.data?.config?.config.input_namespace ?? null;
  let input_namespaces: string[];
  if (typeof input_namespace === "string") {
    input_namespaces = [input_namespace];
  } else if (input_namespace === null) {
    input_namespaces = [];
  } else {
    input_namespaces = Object.keys(input_namespace);
  }

  return (
    <div className={styles.TextUpdaterNode}>
      <div>
        <label
          htmlFor="text"
          style={{
            display: "block",
            color: "#777",
            fontSize: "12px",
          }}
        >
          {props.data.config.name}
        </label>
      </div>
      <div
        style={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <label
          htmlFor="text"
          style={{
            display: "block",
            color: "#777",
            fontSize: "12px",
          }}
        >
          {input_namespaces.map((name) => (
            <div key={name}>{name}</div>
          ))}
        </label>

        {input_namespaces.map((name) => (
          <Handle
            id="in"
            key={name}
            type="target"
            position={Position.Left}
            style={{
              top: `${(100 / (input_namespaces.length + 1)) * (input_namespaces.indexOf(name) + 1)}%`,
            }}
          />
        ))}

        <Handle
          id="out"
          type="source"
          position={Position.Right}
        />
      </div>
    </div>
  );
};

// Remember to useMemo if this is moved inside a component
const nodeTypes = {
  standard: ModuleNode,
};

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
      id: node.data.id,
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
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};

export default Flow;
