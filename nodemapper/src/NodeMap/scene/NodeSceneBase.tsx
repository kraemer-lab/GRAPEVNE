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

  addLink(port_from: any, port_to: any) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
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
        rankdir: "LR",
        rankSep: 100,
        marginx: 100,
        marginy: 100,
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

  getModuleListJSON() {
    const js = [];
    this.engine
      .getModel()
      .getNodes()
      .forEach((node) => {
        js.push(this.getNodeUserConfig(node));
      });
    return js;
  }
}

export default NodeSceneBase;
