import React from 'react'
import NodeMapScene from './NodeMapScene'
import { useAppSelector } from '../redux/store/hooks'
import { useAppDispatch } from '../redux/store/hooks'

export default class NodeMapEngine {
  // Set up a singleton instance of a class
  private static _Instance: NodeMapEngine;
  nodeScene = null;
  engine = null;
  
  constructor() {
    this.nodeScene = new NodeMapScene();
    this.engine = this.nodeScene.engine;
  }
  
  public static get Instance(): NodeMapEngine {
    return NodeMapEngine._Instance || (this._Instance = new this());
  } 

  public NodesSelectNone() {
    this.engine.getModel().getNodes().forEach(item => {
      item.setSelected(false);
    });
  }
  
  public QueryAndLoadTextFile(onLoad: Function) {
    // Opens a file dialog, then executes readerEvent
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
      console.log(e);
      var file = (e.target as HTMLInputElement).files[0];
      var reader = new FileReader();
      reader.readAsText(file,'UTF-8');
      reader.onload = (readerEvent) => onLoad(readerEvent.target.result)
    }
    input.click();
  }

  public LoadScene() { 
    const onLoad = (content) => {
	    this.nodeScene.loadModel(content);
    }
    this.QueryAndLoadTextFile(onLoad)
  }
  
  public SaveScene() {
    var str = this.nodeScene.serializeModel();
    this.Download('model.json', str);
  }
  
  public Download(filename, text) {  
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  public RunScene() {
    alert("Running the scene isn't supported just yet!");
  }

  public getNodeById(id: string): any {
    var returnNode = null
    this.engine.getModel().getNodes().forEach(item => {
      if (item.options.id === id)
        returnNode = item;
    });
    return returnNode
  }

  public getNodePropertiesAsJSON(node: any): Record<string, any> {
    return JSON.parse(node.options.extra)
  }
  
  public getNodePropertiesAsStr(node: any): string {
    return node.options.extra
  }
  
  public getProperty(node: any, prop: string): string {
    const json = this.getNodePropertiesAsJSON(node)
    return json[prop]
  }
  
  public ConstructMapFromBlocks(data: JSON) {
    this.nodeScene.buildMapWithSnippets(data);
  }
}
