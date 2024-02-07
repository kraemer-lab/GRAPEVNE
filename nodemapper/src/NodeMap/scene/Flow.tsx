import { Node as FlowNode } from "reactflow";
import { Edge as FlowEdge } from "reactflow";
import { ModuleType } from "./Module";

export type NodeData = {
  // Place graphical only settings here
  color: string;

  // Keep GRAPEVNE module configuration isolated from any graphical settings
  config: ModuleType;
};

// Declare main Node type, as ReactFlow Node, but with structured NodeData
export type Node = Omit<FlowNode, "data"> & { data: NodeData };

// Declare main Edge type, as ReactFlow Edge
export type Edge = FlowEdge;
