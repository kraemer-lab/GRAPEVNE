import { Component, StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import createEngine from '@projectstorm/react-diagrams'
import { DiagramModel } from '@projectstorm/react-diagrams'
import { DiagramEngine } from '@projectstorm/react-diagrams'
import { DagreEngine } from '@projectstorm/react-diagrams'

import { DefaultNodeModel } from  '../NodeMapComponents'
import { DefaultLinkModel } from  '../NodeMapComponents'

import { BodyWidget } from './BodyWidget'

class NodeScene {
  engine: DiagramEngine;
  nodelist = {}

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

  getNodeUserConfig(node) {
    return JSON.parse(node.options.extras)
  }

  isNodeTypeRule(node) {
    return this.getNodeUserConfig(node).type == 'rule'
  }

  getNodeName(node) {
    return this.getNodeUserConfig(node).name
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

  distributeModel(model) {
    const dagre_engine = new DagreEngine({
			graph: {
				rankdir: 'LR',
				rankSep: 200,
        marginx: 100,
        marginy: 100,
			},
		});
    dagre_engine.redistribute(model)
    this.engine.repaintCanvas();
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
    this.nodelist = {}
    data['block'].forEach((block) => {
      const node_index: number = block['id']
      let colstr = 'rgb(0,192,255)'
      if (block['type'] == 'config') {
        colstr = 'rgb(192,0,255)'
      }
      const node = this.addNode(block['name'], colstr, pos, block);
      this.nodelist[block['name']] = node
      pos[0] += 150
      // count and add ports
      let count_ports_in = 0
      let count_ports_out = 0
      data['links']['content'].forEach((link) => {
        if (link[0]==block['name'])
          count_ports_out++
        if (link[1]==block['name'])
          count_ports_in++
      })
      if (block['type'] == 'rule') {
        if (count_ports_in > 0)
          node.addInPort('in')
        if (count_ports_out > 0)
          node.addOutPort('out')
      }
    });
    data['links']['content'].forEach((link) => {
      console.log(link, this.nodelist)
      try {
        this.addLink(this.nodelist[link[0]].getPort('out'), this.nodelist[link[1]].getPort('in'))
      } catch(e) {
        // pass
      }
    });
    // Mark nodes without connections as completed
    for (const key of Object.keys(this.nodelist)) {
      const node = this.nodelist[key]
      const portsIn = node.getInPorts()
      const portsOut = node.getOutPorts()
      if ((this.isNodeTypeRule(node)) && (portsIn.length==0) && (portsOut.length==0))
        node.setColor('rgb(0,255,0)')
      else if ((this.isNodeTypeRule(node)) && (portsIn.length==0))
        node.setColor('rgb(128,255,0)')
      else if ((this.isNodeTypeRule(node)) && (portsOut.length==0))
        node.setColor('rgb(255,0,255)')
    }
    this.distributeModel(model)
  }

  markNodesWithoutConnectionsAsComplete(data: JSON) {
    for (const key of Object.keys(this.nodelist)) {
      const node = this.nodelist[key]
      // Check if node has any remaining dependencies in the latest DAG
      let has_input = false;
      data['links']['content'].forEach((link) => {
        if ((link[0] == this.getNodeName(node)) || (link[1] == this.getNodeName(node))) {
          has_input = true;
        }
      });
      if (!has_input)
        node.setColor('rgb(0,255,0)')
    }
  }
}

export default NodeScene;
