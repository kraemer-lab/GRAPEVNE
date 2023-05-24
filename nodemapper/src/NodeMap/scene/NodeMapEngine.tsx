import NodeScene from "./NodeScene";

import { NodeModel } from "@projectstorm/react-diagrams";
import { DiagramEngine } from "@projectstorm/react-diagrams";

import { DefaultNodeModel } from "NodeMap";
import { DefaultNodeFactory } from "NodeMap";
import { DefaultPortFactory } from "NodeMap";

interface IPayload {
  id: string;
}

export default class NodeMapEngine {
  nodeScene: NodeScene = null;
  engine: DiagramEngine = null;

  constructor() {
    this.nodeScene = new NodeScene();
    this.engine = this.nodeScene.engine;
    // Register custom factories
    this.engine.getNodeFactories().clearFactories();
    this.engine.getNodeFactories().registerFactory(new DefaultNodeFactory());
    this.engine.getPortFactories().clearFactories();
    this.engine.getPortFactories().registerFactory(new DefaultPortFactory());
  }

  public NodesSelectNone() {
    this.engine
      .getModel()
      .getNodes()
      .forEach((item) => {
        item.setSelected(false);
      });
  }

  public QueryAndLoadTextFile(onLoad: (result) => void) {
    // Opens a file dialog, then executes readerEvent
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files[0];
      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = (readerEvent) => onLoad(readerEvent.target.result);
    };
    input.click();
  }

  public ClearScene() {
    this.nodeScene.clearModel();
  }

  public LoadScene() {
    const onLoad = (content) => {
      this.nodeScene.loadModel(content);
    };
    this.QueryAndLoadTextFile(onLoad);
  }

  public SaveScene() {
    const str = this.nodeScene.serializeModel();
    this.Download("model.json", str);
  }

  public Download(filename, text) {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  public getNodeById(id: string): NodeModel {
    let returnNode = null;
    this.engine
      .getModel()
      .getNodes()
      .forEach((item) => {
        if (item.getOptions().id === id) returnNode = item;
      });
    return returnNode;
  }

  public getNodePropertiesAsJSON(node: NodeModel): Record<string, undefined> {
    return JSON.parse(node.getOptions().extras);
  }

  public getNodePropertiesAsStr(node: NodeModel): string {
    return node.getOptions().extras;
  }

  public getProperty(node: NodeModel, prop: string): string {
    const json = this.getNodePropertiesAsJSON(node);
    return json[prop];
  }

  public ConstructMapFromBlocks(data: JSON) {
    this.nodeScene.buildMapWithSnippets(data);
  }

  public MarkNodesWithoutConnectionsAsComplete(data: JSON) {
    this.nodeScene.markNodesWithoutConnectionsAsComplete(data);
  }

  public ZoomToFit() {
    this.engine.zoomToFit();
  }

  public RedistributeModel() {
    this.nodeScene.distributeModel(this.engine.getModel());
  }

  public GetModuleListJSON() {
    return this.nodeScene.getModuleListJSON();
  }

  public AddSelectionListeners(
    select_fn: (payload: IPayload) => void,
    deselect_fn: (payload: IPayload) => void
  ) {
    // Add listeners, noting the following useful resource:
    // https://github.com/projectstorm/react-diagrams/issues/164
    const model = this.engine.getModel();
    model.getNodes().forEach((node) => {
      node.registerListener({
        selectionChanged: (e) => {
          const payload: IPayload = {
            id: node.getOptions().id,
          };
          if (e.isSelected) {
            select_fn(payload);
          } else {
            deselect_fn(payload);
          }
        },
      });
    });
  }
}
