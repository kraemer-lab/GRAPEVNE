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

  getNodeUserConfig(node): Record<string, unknown> {
    return JSON.parse(node.options.extras);
  }

  isNodeTypeRule(node): boolean {
    return this.getNodeUserConfig(node).type == "rule";
  }

  getNodeName(node): string {
    return this.getNodeUserConfig(node).name as string;
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

  getNodeInputNodes(node: DefaultNodeModel): Record<string, string> {
    // Returns a dictionary of input port names and the nodes they are connected
    const nodes: Record<string, string> = {};
    node.getInPorts().forEach((port: DefaultPortModel) => {
      // Links return a dictionary, indexed by connected node
      if (Object.keys(port.getLinks()).length > 0) {
        if (Object.keys(port.getLinks()).length > 1) {
          throw new Error("Input port has more than one link" + node);
        }
        const link = port.getLinks()[Object.keys(port.getLinks())[0]];
        const node_from =
          link.getTargetPort().getNode() == node
            ? link.getSourcePort().getNode()
            : link.getTargetPort().getNode();
        const input_port_config = this.getNodeUserConfig(node_from);
        nodes[port.getName()] = input_port_config.name as string;
      }
    });
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
          const output_port_config = this.getNodeUserConfig(node_to);
          nodes.push([
            node_to as DefaultNodeModel,
            port_to as DefaultPortModel,
          ]);
        }
      }
    });
    return nodes;
  }

  getModuleListJSON(): Record<string, unknown>[] {
    return this.getModuleListJSONFromNodes(this.engine.getModel().getNodes());
  }

  getModuleListJSONFromNodeNames(
    nodenames: string[]
  ): Record<string, unknown>[] {
    const nodes = nodenames.map((name) => {
      let node = null;
      for (const n of this.engine.getModel().getNodes()) {
        if (this.getNodeName(n) === name) {
          node = n;
          break;
        }
      }
      return node;
    });
    return this.getModuleListJSONFromNodes(nodes);
  }

  getModuleListJSONFromNodes(nodes): Record<string, unknown>[] {
    // Input provides a list of target nodes to generate workflow modules and
    // connectors from.
    const js = [];

    // Add nodes
    nodes.forEach((node: DefaultNodeModel) => {
      js.push(this.getNodeUserConfig(node));
    });

    // Add connectors
    nodes.forEach((node: DefaultNodeModel) => {
      const map = [null, null];
      map[0] = this.getNodeInputNodes(node);
      if (node.getInPorts().length > 0) {
        if (node.getInPorts().length == 1) {
          // If singleton, return string instead of list
          map[0] = map[0][Object.keys(map[0])[0]];
        }
        // Add connector
        if (map[0] !== null && map[0] !== undefined) {
          map[1] = this.getNodeUserConfig(node).name;
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
