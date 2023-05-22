import NodeScene from "./NodeScene";

interface IPayload {
  id: string;
}

export default class NodeMapEngine {
  nodeScene = null;
  engine = null;

  constructor() {
    this.nodeScene = new NodeScene();
    this.engine = this.nodeScene.engine;
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
    // eslint-disable-line @typescript-eslint/ban-types
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

  public RunScene() {
    alert("Running the scene isn't supported just yet!");
  }

  public getNodeById(id: string): any {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    let returnNode = null;
    this.engine
      .getModel()
      .getNodes()
      .forEach((item) => {
        if (item.options.id === id) returnNode = item;
      });
    return returnNode;
  }

  public getNodePropertiesAsJSON(node: any): Record<string, any> {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    return JSON.parse(node.options.extra);
  }

  public getNodePropertiesAsStr(node: any): string {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    return node.options.extra;
  }

  public getProperty(node: any, prop: string): string {
    // eslint-disable-line @typescript-eslint/no-explicit-any
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
    model.getNodes().forEach((node) =>
      node.registerListener({
        selectionChanged: (e) => {
          const payload: IPayload = {
            id: node.options.id,
          };
          if (e.isSelected) {
            select_fn(payload);
          } else {
            deselect_fn(payload);
          }
        },
      })
    );
  }
}
