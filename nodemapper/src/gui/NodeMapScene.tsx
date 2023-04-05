import React from 'react'
import { Component, StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { action } from '@storybook/addon-actions'
import createEngine, { DiagramModel, DiagramEngine } from '@projectstorm/react-diagrams'
import { DefaultNodeModel, DefaultLinkModel } from  '../NodeMapComponents'
import { BodyWidget } from './BodyWidget'

class NodeScene {
  engine: DiagramEngine;

  constructor() {
    this.InitializeScene();
  }

  addNode(name: string, color: string, pos: Array<number>, config: JSON = {} as JSON) {
    const config_str = JSON.stringify(config)
    const node = new DefaultNodeModel(name, color, config_str);
    node.setPosition(pos[0], pos[1]);
    this.engine.getModel().addNode(node);
    return node;
  }

  addNodeWithCode(name: string, color: string, pos: Array<number>, code: string) {
    const config = JSON.parse(JSON.stringify({ 'code': code }));
    return this.addNode(name, color, pos, config);
  }

  addLink(port_from: any, port_to: any) {  // eslint-disable-line @typescript-eslint/no-explicit-any
    const link = new DefaultLinkModel();
    link.setSourcePort(port_from);
    link.setTargetPort(port_to);
    this.engine.getModel().addLink(link);
  }

  InitializeScene() {
    // Initialise Node drawing engine and specify starting layout
    this.engine = createEngine();
    const model = new DiagramModel();
    this.engine.setModel(model);

    const node1 = this.addNode('Input', 'rgb(192,255,0)', [200, 118]);
    node1.addOutPort('out-1');
    node1.addOutPort('out-2');
    node1.addOutPort('out-3');
    node1.addOutPort('out-4');

    const node2 = this.addNode('Process 1', 'rgb(0,192,255)', [325, 100]);
    node2.addInPort('in-1');
    node2.addInPort('in-2');
    node2.addOutPort('out-1');
    node2.addOutPort('out-2');

    const node3 = this.addNode('Process 2', 'rgb(0,192,255)', [500, 80]);
    node3.addInPort('in-1');
    node3.addInPort('in-2');

    const node4 = this.addNode('Logging', 'rgb(192,0,255)', [500, 150]);
    node4.addInPort('in-1');
    node4.addInPort('in-2');
    node4.addInPort('in-3');
    node4.addInPort('in-4');

    this.addLink(node1.getPort('out-1'), node2.getPort('in-1'));
    this.addLink(node2.getPort('out-1'), node3.getPort('in-1'));
    this.addLink(node2.getPort('out-2'), node4.getPort('in-1'));
    this.addLink(node1.getPort('out-4'), node4.getPort('in-2'));
  }

  loadModel(str) {
    const model = new DiagramModel();
    model.deserializeModel(JSON.parse(str), this.engine);
    this.engine.setModel(model);
  }

  serializeModel() {
    return JSON.stringify(this.engine.getModel().serialize());
  }

  buildMapWithSnippets(data: JSON) {
    const model = new DiagramModel();
    this.engine.setModel(model);
    const pos = [50, 50]
    const nodelist = []
    data['block'].forEach((block) => {
      let colstr = 'rgb(0,192,255)'
      if (block['type'] == 'config') {
        colstr = 'rgb(192,0,255)'
      }
      const node = this.addNode(block['name'], colstr, pos, block);
      nodelist.push(node)
      pos[0] += 150
      // add ports
      if (block['type'] == 'rule') {
        node.addInPort('in-1')
        node.addOutPort('out-1')
      }
    });
    data['links']['content'].forEach((link) => {
      this.addLink(nodelist[link[0]].getPort('out-1'), nodelist[link[1]].getPort('in-1'))
    });
  }
}

export default NodeScene;
