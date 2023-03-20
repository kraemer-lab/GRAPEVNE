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

  addLink(port_from: any, port_to: any) {
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
    
    var node1 = this.addNode('Input', 'rgb(192,255,0)', [400, 118]);
    node1.addOutPort('out-1');
    node1.addOutPort('out-2');
    node1.addOutPort('out-3');
    node1.addOutPort('out-4');

    var node2 = this.addNode('Process 1', 'rgb(0,192,255)', [525, 100]);
    node2.addInPort('in-1');
    node2.addInPort('in-2');
    node2.addOutPort('out-1');
    node2.addOutPort('out-2');

    var node3 = this.addNode('Process 2', 'rgb(0,192,255)', [700, 80]);
    node3.addInPort('in-1');
    node3.addInPort('in-2');
    
	var node4 = this.addNode('Logging', 'rgb(192,0,255)', [700, 150]);
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
    var model = new DiagramModel();
    model.deserializeModel(JSON.parse(str), this.engine);
    this.engine.setModel(model);
  }
  
  serializeModel() {
    return JSON.stringify(this.engine.getModel().serialize());
  }
  
  buildMapWithSnippets(data: JSON) {
    var model = new DiagramModel();
    this.engine.setModel(model);
    const pos = [50, 50]
    data['block'].forEach((block) => {
      var colstr = 'rgb(0,192,255)'
      if (block['type'] == 'config') {
        colstr = 'rgb(192,0,255)'
      }
      var node = this.addNode(block['name'], colstr, pos, block);
      console.log(node)
      pos[0] += 150
      // add ports
      if (block['type'] == 'rule') {
	    node.addInPort('in-1')
	    node.addOutPort('out-1')
      }
    });
  }
}

export default NodeScene;
