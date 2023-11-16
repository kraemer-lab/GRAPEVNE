import React from "react";
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
import { EdgeChange } from "reactflow";
import { useNodesState } from "reactflow";
import { useEdgesState } from "reactflow";
import { applyNodeChanges } from "reactflow";
import { applyEdgeChanges } from "reactflow";

import { builderSetNodes } from "redux/actions/builder";
import { builderSetEdges } from "redux/actions/builder";

import "reactflow/dist/style.css";

const proOptions = {
  hideAttribution: true,
};

const BasicFlow = () => {
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

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      proOptions={proOptions}
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};

export default BasicFlow;

