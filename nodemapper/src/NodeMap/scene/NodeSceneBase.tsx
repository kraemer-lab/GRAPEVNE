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

class NodeSceneBase {
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
  ) {
    const config_str = JSON.stringify(config);
    const node = new DefaultNodeModel(name, color, config_str);
    node.setPosition(pos[0], pos[1]);
    this.engine.getModel().addNode(node);
    return node;
  }

  addNodeWithCode(
    name: string,
    color: string,
    pos: Array<number>,
    code: string
  ) {
    const config = JSON.parse(JSON.stringify({ code: code }));
    return this.addNode(name, color, pos, config);
  }

  addLink(port_from: DefaultPortModel, port_to: DefaultPortModel) {
    const link = new DefaultLinkModel();
    link.setSourcePort(port_from);
    link.setTargetPort(port_to);
    this.engine.getModel().addLink(link);
  }

  getNodeUserConfig(node) {
    return JSON.parse(node.options.extras);
  }

  isNodeTypeRule(node) {
    return this.getNodeUserConfig(node).type == "rule";
  }

  getNodeName(node) {
    return this.getNodeUserConfig(node).name;
  }

  InitializeScene() {
    // Initialise Node drawing engine and specify starting layout
    this.engine = createEngine();
    const model = new DiagramModel();
    this.engine.setModel(model);
  }

  distributeModel(model) {
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

  clearModel() {
    const model = new DiagramModel();
    this.engine.setModel(model);
  }

  loadModel(str) {
    const model = new DiagramModel();
    model.deserializeModel(JSON.parse(str), this.engine);
    this.engine.setModel(model);
  }

  serializeModel() {
    return JSON.stringify(this.engine.getModel().serialize());
  }

  getNodeInputNodes(node: DefaultNodeModel) {
    const nodes = {};
    node.getInPorts().forEach((port: DefaultPortModel) => {
      // Links return a dictionary, indexed by connected node
      if (Object.keys(port.getLinks()).length > 0) {
        if (Object.keys(port.getLinks()).length > 1)
          throw new Error("Input port has more than one link" + node);
        const link = port.getLinks()[Object.keys(port.getLinks())[0]];
        const node_from =
          link.getTargetPort().getNode() == node
            ? link.getSourcePort().getNode()
            : link.getTargetPort().getNode();
        const input_port_config = this.getNodeUserConfig(node_from);
        nodes[port.getName()] = input_port_config.name;
      }
    });
    return nodes;
  }

  getModuleListJSON() {
    const js = [];
    return this.getModuleListJSONFromNodes(this.engine.getModel().getNodes());
  }

  getModuleListJSONFromNodeNames(nodenames: string[]) {
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

  getModuleListJSONFromNodes(nodes, add_connector = false) {
    const js = [];

    // Add nodes
    nodes.forEach((node: DefaultNodeModel) => {
      js.push(this.getNodeUserConfig(node));
    });

    // Add connectors (for first node only)
    const node: DefaultNodeModel = nodes[0];
    const map = [null, null];
    map[0] = this.getNodeInputNodes(node);
    if (node.getInPorts().length > 0) {
      if (node.getInPorts().length == 1) {
        // If singleton, return string instead of list
        map[0] = map[0][Object.keys(map[0])[0]];
      }
      // Add connector
      if (map[0] !== null) {
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
    return js;
  }
}

export default NodeSceneBase;
