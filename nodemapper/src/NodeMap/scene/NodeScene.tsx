import { Component } from "react";
import { StrictMode } from "react";
import { useRef } from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import createEngine from "@projectstorm/react-diagrams";
import { DiagramModel } from "@projectstorm/react-diagrams";
import { DiagramEngine } from "@projectstorm/react-diagrams";
import { DagreEngine } from "@projectstorm/react-diagrams";

import { DefaultNodeModel } from "NodeMap";
import { DefaultPortModel } from "NodeMap";
import { DefaultLinkModel } from "NodeMap";

class NodeScene {
  engine: DiagramEngine;
  nodelist = {};

  constructor() {
    this.InitializeScene();
  }

  addNode(
    name: string,
    color: string,
    pos: Array<number>,
    config: JSON = {} as JSON
  ): DefaultNodeModel {
    const config_str = JSON.stringify(config);
    const node = new DefaultNodeModel(name, color, config_str);
    node.setPosition(pos[0], pos[1]);
    this.engine.getModel().addNode(node);
    return node;
  }

  addLink(
    port_from: DefaultPortModel,
    port_to: DefaultPortModel
  ): DefaultLinkModel {
    const link = new DefaultLinkModel();
    link.setSourcePort(port_from);
    link.setTargetPort(port_to);
    this.engine.getModel().addLink(link);
    return link;
  }

  getNodeUserProperties(node): Record<string, unknown> {
    return node.data.config;
  }

  setNodeUserProperties(
    node: DefaultNodeModel,
    properties: Record<string, unknown>
  ): void {
    const opts = node.getOptions();
    opts.extras = JSON.stringify(properties);
    node.setOptions(opts);
  }

  getNodeWorkflow(node: DefaultNodeModel): Record<string, unknown> {
    const userConfig = this.getNodeUserProperties(node);
    return userConfig["config"] as Record<string, unknown>;
  }

  setNodeWorkflow(
    node: DefaultNodeModel,
    workflow: string | Record<string, unknown>
  ): void {
    const opts = node.getOptions();
    const userProperties = JSON.parse(opts.extras);
    userProperties["config"] = workflow;
    opts.extras = JSON.stringify(userProperties);
    node.setOptions(opts);
  }

  getNodeWorkflowParams(node: DefaultNodeModel): Record<string, unknown> {
    const workflowParams = this.getNodeWorkflow(node);
    return workflowParams["config"] as Record<string, unknown>;
  }

  setNodeWorkflowParams(
    node: DefaultNodeModel,
    workflowParams: string | Record<string, unknown>
  ): void {
    const opts = node.getOptions();
    const userProperties = JSON.parse(opts.extras);
    userProperties["config"]["config"] = workflowParams;
    opts.extras = JSON.stringify(userProperties);
    node.setOptions(opts);
  }

  isNodeTypeRule(node: DefaultNodeModel): boolean {
    return this.getNodeUserProperties(node).type == "rule";
  }

  getNodeName(node: DefaultNodeModel): string {
    return this.getNodeUserProperties(node).name as string;
  }

  setNodeName(node: DefaultNodeModel, name: string): void {
    const opts = node.getOptions();
    const userProperties = JSON.parse(opts.extras);
    userProperties["name"] = name;
    opts.extras = JSON.stringify(userProperties);
    node.setOptions(opts);
  }

  InitializeScene(): void {
    // Initialise Node drawing engine and specify starting layout
    this.engine = createEngine();
    const model = new DiagramModel();
    this.engine.setModel(model);
  }

  distributeModel(model): void {
    const dagre_engine = new DagreEngine({
      graph: {
        rankdir: "UD",
        rankSep: 50,
        marginx: 100,
        marginy: 50,
      },
    });
    dagre_engine.redistribute(model);
    this.engine.repaintCanvas();
  }

  clearModel(): void {
    const model = new DiagramModel();
    this.engine.setModel(model);
  }

  loadModel(str): void {
    const model = new DiagramModel();
    model.deserializeModel(JSON.parse(str), this.engine);
    this.engine.setModel(model);
  }

  serializeModel(): string {
    return JSON.stringify(this.engine.getModel().serialize());
  }

  getNodeInputNodes(node, edges): Record<string, string> {
    // Returns a dictionary of input port names and the nodes they are connected
    //
    // Example outputs:
    //  { "In": "from_node" }
    //  { "seeds": "get_seeds_source", "file": "download_datafile_source"}
    const nodes: Record<string, string> = {};
    const in_conns = edges.filter(
      (edge) => edge.target === node.data.config.name
    );
    for (const conn in in_conns) {
      let portname = "in";
      if ("targetHandle" in in_conns[conn])
        portname = in_conns[conn].targetHandle;
      nodes[portname] = in_conns[conn].source;
    }
    return nodes;
  }

  getNodeOutputNodes(
    node: DefaultNodeModel
  ): [DefaultNodeModel, DefaultPortModel][] {
    // Returns a dictionary of input port names and the nodes they are connected
    const nodes: [DefaultNodeModel, DefaultPortModel][] = [];
    const out_ports = node.getOutPorts();
    if (out_ports.length > 1)
      throw new Error("Node has more than one output port!");
    out_ports.forEach((port: DefaultPortModel) => {
      // Links return a dictionary, indexed by connected node
      if (Object.keys(port.getLinks()).length > 0) {
        const links = port.getLinks();
        for (const key in port.getLinks()) {
          const link = port.getLinks()[key];
          const port_to =
            link.getTargetPort().getNode() == node
              ? link.getSourcePort()
              : link.getTargetPort();
          const node_to = port_to.getNode();
          const output_port_config = this.getNodeUserProperties(
            node_to as DefaultNodeModel
          );
          nodes.push([
            node_to as DefaultNodeModel,
            port_to as DefaultPortModel,
          ]);
        }
      }
    });
    return nodes;
  }

  getModuleListJSON(nodes, edges): Record<string, unknown>[] {
    return this.getModuleListJSONFromNodes(nodes, edges);
  }

  getModuleListJSONFromNodeNames(
    nodenames: string[]
  ): Record<string, unknown>[] {
    throw new Error("Not implemented error.");

    /*const nodes = nodenames.map((name) => {
      let node = null;
      for (const n of this.engine.getModel().getNodes()) {
        if (this.getNodeName(n as DefaultNodeModel) === name) {
          node = n;
          break;
        }
      }
      return node;
    });
    return this.getModuleListJSONFromNodes(nodes);*/
  }

  getNodeInputPortCount(node): number {
    // Return the number of input ports for a given node //
    const input_namespace = node.data.config.config.config.input_namespace;
    if (input_namespace === null || input_namespace === undefined) return 0;
    if (typeof input_namespace === "string") return 1;
    return Object.keys(input_namespace).length;
  }

  getModuleListJSONFromNodes(nodes, edges): Record<string, unknown>[] {
    // Input provides a list of target nodes to generate workflow modules and
    // connectors from.
    const js = [];

    // Add nodes
    nodes.forEach((node: Node) => {
      js.push(this.getNodeUserProperties(node));
    });

    // Add connectors
    nodes.forEach((node) => {
      const map = [null, null];
      map[0] = this.getNodeInputNodes(node, edges);
      const in_ports_count = this.getNodeInputPortCount(node);
      if (in_ports_count > 0) {
        if (in_ports_count == 1) {
          // If singleton, return string instead of list
          map[0] = map[0][Object.keys(map[0])[0]];
        }
        // Add connector
        if (map[0] !== null && map[0] !== undefined) {
          map[1] = this.getNodeUserProperties(node).name;
          const conn = {
            name: "Join [" + map[1] + "]",
            type: "connector",
            config: {
              map: map,
            },
          };
          js.push(conn);
        }
      }
    });
    return js;
  }

  buildMapWithSnippets(data: JSON) {
    const model = new DiagramModel();
    this.engine.setModel(model);
    const pos = [50, 50];
    this.nodelist = {};
    data["block"].forEach((block) => {
      const node_index: number = block["id"];
      let colstr = "rgb(0,192,255)";
      if (block["type"] == "config") {
        colstr = "rgb(192,0,255)";
      }
      const node = this.addNode(block["name"], colstr, pos, block);
      this.nodelist[block["name"]] = node;
      pos[0] += 150;
      // count and add ports
      let count_ports_in = 0;
      let count_ports_out = 0;
      data["links"]["content"].forEach((link) => {
        if (link[0] == block["name"]) count_ports_out++;
        if (link[1] == block["name"]) count_ports_in++;
      });
      if (block["type"] == "rule") {
        if (count_ports_in > 0) node.addInPort("in");
        if (count_ports_out > 0) node.addOutPort("out");
      }
    });
    data["links"]["content"].forEach((link) => {
      console.debug(link, this.nodelist);
      try {
        this.addLink(
          this.nodelist[link[0]].getPort("out"),
          this.nodelist[link[1]].getPort("in")
        );
      } catch (e) {
        // pass
      }
    });
    // Mark nodes without connections as completed
    for (const key of Object.keys(this.nodelist)) {
      const node = this.nodelist[key];
      const portsIn = node.getInPorts();
      const portsOut = node.getOutPorts();
      if (
        this.isNodeTypeRule(node) &&
        portsIn.length == 0 &&
        portsOut.length == 0
      )
        node.setColor("rgb(0,255,0)");
      else if (this.isNodeTypeRule(node) && portsIn.length == 0)
        node.setColor("rgb(128,255,0)");
      else if (this.isNodeTypeRule(node) && portsOut.length == 0)
        node.setColor("rgb(255,0,255)");
    }
    this.distributeModel(model);
  }

  markNodesWithoutConnectionsAsComplete(data: JSON) {
    for (const key of Object.keys(this.nodelist)) {
      const node = this.nodelist[key];
      // Check if node has any remaining dependencies in the latest DAG
      let has_input = false;
      data["links"]["content"].forEach((link) => {
        if (
          link[0] == this.getNodeName(node) ||
          link[1] == this.getNodeName(node)
        ) {
          has_input = true;
        }
      });
      if (!has_input) node.setColor("rgb(0,255,0)");
    }
  }
}

export default NodeScene;
