import NodeScene from "./NodeScene";

import { keys } from "lodash";
import { NodeModel } from "@projectstorm/react-diagrams";
import { DiagramEngine } from "@projectstorm/react-diagrams";

import { DefaultLinkModel } from "NodeMap";
import { DefaultPortModel } from "NodeMap";
import { DefaultNodeModel } from "NodeMap";
import { DefaultNodeFactory } from "NodeMap";
import { DefaultPortFactory } from "NodeMap";

import { Node } from "reactflow";
import { Edge } from "reactflow";

import * as globals from "redux/globals";

type Query = Record<string, unknown>;
const API_ENDPOINT = globals.getApiEndpoint();

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

  public DeselectAll() {
    this.engine
      .getModel()
      .getNodes()
      .forEach((item) => {
        item.setSelected(false);
      });
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

  public getNodeName(node: Node): string {
    return node.data.config.name;
  }

  public setNodeName(node: Node, newname: string) {
    node.data.config.name = newname;
  }

  public getNodeByName(name: string, nodes): Node {
    let returnNode = null;
    nodes.forEach((item) => {
      if (item.data.config.name === name) returnNode = item;
    });
    return returnNode;
  }

  public getNodePropertiesAsJSON(node): Record<string, undefined> {
    return node.data.config;
  }

  public setNodePropertiesAsJSON(node, json) {
    node.data.config = json;
  }

  public getNodePropertiesAsStr(node: NodeModel): string {
    return JSON.stringify(this.getNodePropertiesAsJSON(node));
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

  public GetModuleListJSON(nodes, edges) {
    return this.nodeScene.getModuleListJSON(nodes, edges);
  }

  public AddSelectionListeners(
    select_fn: (payload: IPayload) => void,
    deselect_fn: (payload: IPayload) => void,
    delete_fn: () => void,
    addlink_fn: (payload: DefaultLinkModel) => void
  ) {
    // Add listeners, noting the following useful resource:
    // https://github.com/projectstorm/react-diagrams/issues/164
    const model = this.engine.getModel();
    // Clear listeners on base model (link listeners)
    model.clearListeners();
    // New link listener
    model.registerListener({
      linksUpdated: (event) => {
        const link = event.link as DefaultLinkModel;
        link.registerListener({
          targetPortChanged: (event) => {
            addlink_fn(link);
          },
        });
      },
    });
    // Add node selection listeners
    model.getNodes().forEach((node) => {
      this.RegisterNodeListeners(node, select_fn, deselect_fn, delete_fn);
    });
  }

  public RegisterNodeListeners(
    node: NodeModel,
    select_fn: (payload: IPayload) => void,
    deselect_fn: (payload: IPayload) => void,
    delete_fn: () => void
  ) {
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
      entityRemoved: (e) => {
        delete_fn();
      },
    });
  }

  public GetLeafNodes(): NodeModel[] {
    const leafNodes = [];
    this.engine
      .getModel()
      .getNodes()
      .forEach((node) => {
        if (
          Object.keys(
            this.nodeScene.getNodeOutputNodes(node as DefaultNodeModel)
          ).length == 0
        )
          leafNodes.push(node);
      });
    return leafNodes;
  }

  public GetLeafNodeNames(nodes: Node[], edges: Edge[]): string[] {
    const source_names = edges.map((edge) => edge.source);
    const leaf_node_names = nodes
      .map((node) => node.data.config.name)
      .filter((name) => !source_names.includes(name));
    return leaf_node_names;
  }

  public DoesNodeNameClash(name: string, nodes: Node[]): boolean {
    return name in nodes.map((node) => node.data.config.name);
  }

  public GetUniqueName(name: string, nodes: Node[]): string {
    // Adds a postfix to the name to make it unique
    // Note: this function always adds a postfix, use EnsureUniqueName to
    //       preserve existing name if possible
    let nodePostfix = 0;
    while (this.DoesNodeNameClash(name + "_" + ++nodePostfix, nodes));
    return (name += "_" + nodePostfix);
  }

  public EnsureUniqueName(name: string, nodes: Node[]): string {
    // Preserves existing name if no clashes, otherwise adds a postfix
    if (this.DoesNodeNameClash(name, nodes))
      return this.GetUniqueName(name, nodes);
    return name;
  }

  public AddNodeToGraph(
    data: Record<string, unknown>,
    point,
    color,
    uniquenames = true,
    nodes = null
  ): DefaultNodeModel {
    let node = null;
    let node_name = data.name as string;
    // Unique name
    if (uniquenames) node_name = this.EnsureUniqueName(node_name, nodes);
    // Create node
    node = new DefaultNodeModel(
      node_name,
      color,
      JSON.stringify({
        id: "idcode", // TODO
        name: node_name,
        type: data.type,
        config: data.config,
      })
    );
    // Determine number (and names of input ports)
    let input_namespace = {}; // namespace names (for ports)
    let input_namespace_mapping = {}; // namespace mappings ('_*'=hidden, etc)
    const params = (data.config as Query).config as Query;
    if (params.input_namespace === undefined) {
      // No input namespace specified - use default unless source
      if (data.type !== "source") {
        input_namespace["In"] = "In";
      }
    } else if (params.input_namespace === null) {
      // Null input namespace specified - no input ports
    } else if (typeof params.input_namespace === "object") {
      // Where the input namespace is an object (probably a dictionary)
      input_namespace = Object.keys(params.input_namespace);
      input_namespace_mapping = Object.values(params.input_namespace);
    } else {
      // Where the input namespace is not an object (probably a string)
      input_namespace["In"] = "In";
      input_namespace_mapping["In"] = params.input_namespace;
    }
    return node;
  }

  public CanNodeExpand(name: string, nodes): boolean {
    const node = this.getNodeByName(name, nodes);
    if (!node) return false;
    const json = this.getNodePropertiesAsJSON(node);
    if (!json.config) return false;
    if (!json.config["config"]) return false;
    const modules = json.config["config"] as Record<string, unknown>;
    let can_node_expand = false;
    for (const item in modules) {
      if (modules[item] === null || modules[item] === undefined) continue;
      if (modules[item]["config"] === undefined) continue;
      can_node_expand = true;
      break;
    }
    return can_node_expand;
  }

  public getNodePosition(node) {
    return node.position;
  }

  public getUniqueID(elements: Node[] | Edge[]) {
    const ids = elements.map((element) => element.id);
    let id = 0;
    while (id.toString() in ids) id++;
    return id.toString();
  }

  public getNodeInputNodes(node: Node, nodes: Node[], edges: Edge[]) {
    const from_nodes = edges
      .filter((edge) => edge.target === node.data.config.name)
      .map((edge) => edge.source);
    return [...new Set(from_nodes)]; // Remove duplicates
  }

  public getNodeNameFromID(id: string, nodes: Node[]) {
    const node = nodes.filter((node) => node.id === id)[0];
    return node.data.config.name;
  }

  public getNodeOutputNodes(node: Node, nodes: Node[], edges: Edge[]) {
    const nodes_and_ports = [];
    const from_edges = edges.filter(
      (edge) => edge.source === node.data.config.name
    );
    from_edges.forEach((edge) => {
      nodes_and_ports.push([
        this.getNodeNameFromID(edge.target, nodes),
        edge.targetHandle,
      ]);
    });
    return nodes_and_ports;
  }

  public ExpandNodeByName(
    name: string,
    nodes: Node[],
    edges: Edge[]
  ): [Node[], Edge[]] {
    console.log("ExpandNodeByName");

    const node = this.getNodeByName(name, nodes);
    if (!node) return [null, null];
    const json = this.getNodePropertiesAsJSON(node);
    if (!json.config) return [null, null];
    if (!json.config["config"]) return [null, null];

    // Initialise returned nodes and edges structures
    let all_nodes = JSON.parse(JSON.stringify(nodes));
    let all_edges = JSON.parse(JSON.stringify(edges));

    // Modules list
    const modules = json.config["config"] as Record<string, unknown>;
    if (!modules) return [null, null];

    // Create sub-nodes from modules list
    const newnodes = [];
    const namemap: Record<string, string> = {};
    let offset = 0.0;
    for (const item in modules) {
      console.log("item:");
      console.log(item);

      if (modules[item] === null || modules[item] === undefined) continue;
      if (modules[item]["config"] === undefined) continue;
      const params = modules[item]["config"] as Record<string, unknown>;
      const config: Record<string, unknown> = {};
      for (const key in modules[item] as Record<string, unknown>) {
        if (key === "name") continue;
        if (key === "type") continue;
        if (key === "config") {
          config["config"] = modules[item][key];
        } else {
          config[key] = modules[item][key];
        }
      }
      // Node config
      const data = {
        name: item,
        type: (modules[item] as Record<string, unknown>).type,
        config: config,
      };
      const newpoint = { ...this.getNodePosition(node) };
      newpoint.x += offset;
      newpoint.y += offset;
      offset += 15.0;
      // Determine unique name (but don't substitute yet)
      const uniquename = this.EnsureUniqueName(data.name, nodes);
      if (uniquename !== data.name) namemap[data.name] = uniquename;
      // Call AddNodeToGraph with uniquenames = false to prevent node renaming
      // (at least until after the graph is expanded)
      const module_type = NodeMapEngine.GetModuleType(
        data.config.config as Record<string, unknown>
      );

      // New node
      const newnode = {
        id: this.getUniqueID(nodes.concat(newnodes)),
        type: "standard",
        position: newpoint,
        data: {
          color: NodeMapEngine.GetModuleTypeColor(module_type),
          config: data,
        },
      };
      newnodes.push(newnode);
    }

    // Connect sub-graph based on namespaces
    newnodes.forEach((node_from) => {
      const config = this.getNodePropertiesAsJSON(node_from)[
        "config"
      ] as Record<string, unknown>;
      const params = config["config"];
      const output_namespace = params["output_namespace"];
      newnodes.forEach((node_to) => {
        const config = this.getNodePropertiesAsJSON(node_to)[
          "config"
        ] as Record<string, unknown>;
        const params = config["config"];
        const input_namespace = params["input_namespace"];
        if (typeof input_namespace === "string") {
          // string = single input port
          if (output_namespace === input_namespace) {
            const newedge = {
              id: this.getUniqueID(edges),
              source: node_from.id,
              sourceHandle: "Out",
              target: node_to.id,
              targetHandle: "In",
            };
            all_edges.push(newedge);
          }
        } else {
          // record = multiple input ports
          for (const key in input_namespace) {
            if (output_namespace === input_namespace[key]) {
              const newedge = {
                id: this.getUniqueID(edges),
                source: node_from.id,
                sourceHandle: "Out",
                target: node_to.id,
                targetHandle: key,
              };
              all_edges.push(newedge);
            }
          }
        }
      });
    });

    // Map input connections to sub-graph
    const from_nodes = this.getNodeInputNodes(node, nodes, edges);
    for (const node_label in from_nodes) {
      const node_name = from_nodes[node_label];
      const node_from = this.getNodeByName(node_name, nodes);
      if (!node_from) continue;
      // Lookup target port in sub-graph
      const port_name_list = node_label.split("$");
      const targetnode_name = port_name_list[0];
      let port_name = "";
      if (port_name_list.length == 1) {
        port_name = "In";
      } else if (port_name_list.length == 2) {
        if (port_name_list[1] === "") {
          port_name = "In";
        } else {
          port_name = port_name_list[1];
        }
      } else {
        throw new Error("Recursive port naming not yet supported.");
      }
      const target_node = this.getNodeByName(targetnode_name, nodes);
      const newedge = {
        id: this.getUniqueID(edges),
        source: node_from.id,
        sourceHandle: "Out",
        target: target_node.id,
        targetHandle: port_name,
      };
      all_edges.push(newedge);
    }

    // Map output connections from sub-graph
    const config = this.getNodePropertiesAsJSON(node)["config"] as Record<
      string,
      unknown
    >;
    const output_namespace = config["config"]["output_namespace"];
    const target_node_and_port = this.getNodeOutputNodes(node, nodes, edges);
    for (let i = 0; i < target_node_and_port.length; i++) {
      const target_node = target_node_and_port[i][0];
      const target_port = target_node_and_port[i][1];
      // Lookup output port in sub-graph
      newnodes.forEach((node_from) => {
        const config = this.getNodePropertiesAsJSON(node_from)[
          "config"
        ] as Record<string, unknown>;
        const namespace = config["config"]["output_namespace"];
        if (namespace == output_namespace) {
          const newedge = {
            id: this.getUniqueID(edges),
            source: node_from.id,
            sourceHandle: "Out",
            target: target_node.id,
            targetHandle: target_port,
          };
          all_edges.push(newedge);
        }
      });
    }

    // Delete expanded node (and connected edges)
    all_nodes = all_nodes.filter((item) => item.data.config.name !== name);
    all_edges = all_edges
      .filter((item) => item.source !== name)
      .filter((item) => item.target !== name);

    // Ensure unique names (subgraph was expanded without renaming so may
    //   clash with existing nodes)
    // Replace node names in newnode configs (namespaces)
    newnodes.forEach((node) => {
      const json = this.getNodePropertiesAsJSON(node);
      const outerconfig = json.config as Record<string, unknown>;
      const config = outerconfig["config"] as Record<string, unknown>;
      for (const key in config) {
        if (key == "output_namespace") {
          if (Object.keys(namemap).includes(config[key] as string)) {
            config[key] = namemap[config[key] as string];
          }
        }
        if (key === "input_namespace") {
          const input_namespace = config[key];
          if (typeof input_namespace === "string") {
            // string = single input port
            if (Object.keys(namemap).includes(input_namespace)) {
              config[key] = namemap[input_namespace];
            }
          } else {
            // record = multiple input ports
            for (const inkey in input_namespace as Record<string, unknown>) {
              const inval = input_namespace[inkey];
              if (Object.keys(namemap).includes(inval as string)) {
                input_namespace[inkey] = namemap[inval as string];
              }
            }
          }
        }
      }
      // Save changes back to node
      this.setNodePropertiesAsJSON(node, json);
    });
    // Finally, substitute node names
    newnodes.forEach((node) => {
      const nodename = this.getNodeName(node);
      if (Object.keys(namemap).includes(nodename)) {
        console.log(
          "(expand) substitution: " + nodename + " -> " + namemap[nodename]
        );
        this.setNodeName(node, namemap[nodename]);
      }
    });

    // Concatenate new nodes with existing nodes
    all_nodes = all_nodes.concat(newnodes);
    return [all_nodes, all_edges];
  }

  public static GetModuleType(config: Record<string, unknown>): string {
    for (const key in config) {
      if (key === "input_namespace") {
        const value = config[key];
        if (value === null) {
          return "source";
        }
      }
    }
    return "module";
  }

  public static GetModuleTypeColor(type: string): string {
    let color = "";
    switch (type) {
      case "disabled": {
        color = "#8b8c89";
        break;
      }
      case "source": {
        color = "#44aa44";
        break;
      }
      case "module": {
        color = "#006daa";
        break;
      }
      case "connector": {
        color = "rgb(0,255,192)";
        break;
      }
      case "terminal": {
        color = "rgb(192,0,255)";
        break;
      }
      default: {
        color = "rgb(128,128,128)";
        break;
      }
    }
    return color;
  }
}
