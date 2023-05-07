import createEngine from '@projectstorm/react-diagrams';
import { DiagramEngine } from '@projectstorm/react-diagrams';
import { DiagramModel } from '@projectstorm/react-diagrams';
import { DefaultNodeModel } from 'NodeMap'
import { DefaultLinkModel } from 'NodeMap'

// Based on the projectstorm drag-and-drop demo by Dylan Vorster
export default class Application {
  private static _Instance: Application;

	engine: DiagramEngine;

	constructor() {
		this.engine = createEngine()
    const model = new DiagramModel()
    this.engine.setModel(model)
	}

  public static get Instance(): Application {
    return Application._Instance || (this._Instance = new this());
  }

  public TestCreateDiagram() {
		const node1 = new DefaultNodeModel('Node 1', 'rgb(0,192,255)', '');
		const port = node1.addOutPort('Out');
		node1.setPosition(100, 100);

		const node2 = new DefaultNodeModel('Node 2', 'rgb(192,255,0)', '');
		const port2 = node2.addInPort('In');
		node2.setPosition(400, 100);

		const link1 = port.link(port2);

		this.engine.getModel().addAll(node1, node2, link1);
    this.engine.repaintCanvas();
  }

	public getActiveDiagram(): DiagramModel {
		return this.engine.getModel();
	}

	public getDiagramEngine(): DiagramEngine {
		return this.engine;
	}
}
