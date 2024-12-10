import { Edge } from 'reactflow';
import { Node } from './Flow';

export default class NodeMapEngine {
  public QueryAndLoadTextFile(onLoad: (result) => void) {
    // Opens a file dialog, then executes readerEvent
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files[0];
      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onload = (readerEvent) => onLoad(readerEvent.target.result);
    };
    input.click();
  }

  public Download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  public getNodeName(node: Node): string {
    return node.data.config.name;
  }

  public setNodeName(node: Node, newname: string) {
    node.data.config.name = newname;
  }

  public setNodeColor(node: Node, newcolor: string, nodes: Node[]) {
    const newnode = JSON.parse(JSON.stringify(node));
    newnode.data.color = newcolor;
    return nodes.map((item) => {
      if (item.id === node.id) return newnode;
      return item;
    });
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

  public getNodePropertiesAsStr(node: Node): string {
    return JSON.stringify(this.getNodePropertiesAsJSON(node));
  }

  public getNodeColor(node: Node): string {
    return node.data.color;
  }

  public getNodeType(node: Node): string {
    return node.data.config.type;
  }

  public getModuleListJSONFromNodeNames(
    nodenames: string[],
    nodes: Node[],
    edges: Edge[],
  ): Record<string, unknown>[] {
    const newnodes = nodenames.map((name) => {
      let node = null;
      for (const n of nodes) {
        if (this.getNodeName(n) === name) {
          node = n;
          break;
        }
      }
      return node;
    });
    return this.getModuleListJSONFromNodes(newnodes, edges);
  }

  public getInPorts(node: Node, edges: Edge[]): string[] {
    const inports = edges
      .filter((edge) => edge.target === node.id)
      .map((edge) => edge.targetHandle);
    return [...new Set(inports)]; // Remove duplicates
  }

  public getModuleListJSONFromNodes(nodes: Node[], edges: Edge[]): Record<string, unknown>[] {
    // Input provides a list of target nodes to generate workflow modules and
    // connectors from.
    const js = [];

    // Add nodes
    nodes.forEach((node: Node) => {
      js.push(this.getNodePropertiesAsJSON(node));
    });

    // Add connectors
    nodes.forEach((node: Node) => {
      const map = [null, null];
      map[0] = this.getNodeInputNodes(node, nodes, edges);
      if (this.getInPorts(node, edges).length > 0) {
        if (this.getInPorts(node, edges).length == 1) {
          // If singleton, return string instead of list
          map[0] = map[0][Object.keys(map[0])[0]];
        }
        // Add connector
        if (map[0] !== null && map[0] !== undefined) {
          map[1] = this.getNodePropertiesAsJSON(node).name;
          const conn = {
            name: 'Join [' + map[1] + ']',
            type: 'connector',
            config: {
              map: map,
            },
          };
          js.push(conn);
        }
      }
    });
    return js;
  }

  public GetLeafNodeNames(nodes: Node[], edges: Edge[]): string[] {
    const source_ids = edges.map((edge) => edge.source);
    const leaf_node_names = nodes
      .map((node) => node.id)
      .filter((id) => !source_ids.includes(id))
      .map((id) => this.getNodeNameFromID(id, nodes));
    return leaf_node_names;
  }

  public DoesNodeNameClash(name: string, nodes: Node[]): boolean {
    return nodes.map((node) => node.data.config.name).includes(name);
  }

  public GetUniqueName(name: string, nodes: Node[]): string {
    // Adds a postfix to the name to make it unique
    // Note: this function always adds a postfix, use EnsureUniqueName to
    //       preserve existing name if possible
    let nodePostfix = 0;
    while (this.DoesNodeNameClash(name + '_' + ++nodePostfix, nodes));
    return (name += '_' + nodePostfix);
  }

  public EnsureUniqueName(name: string, nodes: Node[]): string {
    // Preserves existing name if no clashes, otherwise adds a postfix
    if (this.DoesNodeNameClash(name, nodes)) return this.GetUniqueName(name, nodes);
    return name;
  }

  public CanNodeExpand(name: string, nodes: Node[]): boolean {
    const node = this.getNodeByName(name, nodes);
    if (!node) return false;
    const json = this.getNodePropertiesAsJSON(node);
    if (!json.config) return false;
    if (!json.config['config']) return false;
    const modules = json.config['config'] as Record<string, unknown>;
    let can_node_expand = false;
    for (const item in modules) {
      if (modules[item] === null || modules[item] === undefined) continue;
      if (modules[item]['config'] === undefined) continue;
      can_node_expand = true;
      break;
    }
    return can_node_expand;
  }

  public getNodePosition(node) {
    return node.position;
  }

  public getUniqueNodeID(elements: Node[]): string {
    const ids = elements.map((element) => element.id);
    let id = 0;
    while (ids.includes('n' + id.toString())) id++;
    return 'n' + id.toString();
  }

  public getUniqueEdgeID(elements: Edge[]): string {
    const ids = elements.map((element) => element.id);
    let id = 0;
    while (ids.includes('e' + id.toString())) id++;
    return 'e' + id.toString();
  }

  public getNodeInputNodes(node: Node, nodes: Node[], edges: Edge[]): Record<string, string> {
    // Returns a dictionary of input port names and the nodes they are connected to
    const conn_edges = edges.filter((edge) => edge.target === node.id);
    const d = {};
    conn_edges.forEach(
      (edge) => (d[edge.targetHandle] = this.getNodeNameFromID(edge.source, nodes)),
    );
    return d;
  }

  public getNodeNameFromID(id: string, nodes: Node[]) {
    const node = nodes.filter((node) => node.id === id)[0];
    return node.data.config.name;
  }

  public getNodeOutputNodes(node: Node, nodes: Node[], edges: Edge[]) {
    const nodes_and_ports = [];
    const from_edges = edges.filter((edge) => edge.source === node.id);
    from_edges.forEach((edge) => {
      nodes_and_ports.push([this.getNodeNameFromID(edge.target, nodes), edge.targetHandle]);
    });
    return nodes_and_ports;
  }

  getNodeInputPortCount(node): number {
    // Return the number of input ports for a given node //
    const input_namespace = node.data.config.config.config.input_namespace;
    if (input_namespace === null || input_namespace === undefined) return 0;
    if (typeof input_namespace === 'string') return 1;
    return Object.keys(input_namespace).length;
  }

  public GetModuleListJSON(nodes: Node[], edges: Edge[]): Record<string, unknown>[] {
    // Input provides a list of target nodes to generate workflow modules and
    // connectors from.
    const js = [];

    // Add nodes
    nodes.forEach((node: Node) => {
      js.push(this.getNodePropertiesAsJSON(node));
    });

    // Add connectors
    nodes.forEach((node) => {
      const map = [null, null];
      map[0] = this.getNodeInputNodes(node, nodes, edges);
      const in_ports_count = this.getNodeInputPortCount(node);
      if (in_ports_count > 0) {
        if (typeof node.data.config.config.config.input_namespace === 'string') {
          // If the input namespace is a string, then return a string instead of a list
          map[0] = map[0][Object.keys(map[0])[0]];
        }
        // Add connector
        if (map[0] !== null && map[0] !== undefined) {
          map[1] = this.getNodePropertiesAsJSON(node).name;
          const conn = {
            name: 'Join [' + map[1] + ']',
            type: 'connector',
            config: {
              map: map,
            },
          };
          js.push(conn);
        }
      }
    });
    return js;
  }

  public ExpandNodeByName(name: string, nodes: Node[], edges: Edge[]): [Node[], Edge[]] {
    console.log('ExpandNodeByName');

    const node = this.getNodeByName(name, nodes);
    if (!node) return [null, null];
    const json = this.getNodePropertiesAsJSON(node);
    if (!json.config) return [null, null];
    if (!json.config['config']) return [null, null];

    // Initialise returned nodes and edges structures
    let all_nodes = JSON.parse(JSON.stringify(nodes));
    let all_edges = JSON.parse(JSON.stringify(edges));

    // Modules list
    const modules = json.config['config'] as Record<string, unknown>;
    if (!modules) return [null, null];

    // Create sub-nodes from modules list
    const newnodes = [];
    const namemap: Record<string, string> = {};
    let offset = 0.0;
    for (const item in modules) {
      if (modules[item] === null || modules[item] === undefined) continue;
      if (modules[item]['config'] === undefined) continue;
      const config: Record<string, unknown> = {};
      for (const key in modules[item] as Record<string, unknown>) {
        if (key === 'name') continue;
        if (key === 'type') continue;
        if (key === 'config') {
          config['config'] = modules[item][key];
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
      const uniquename = this.EnsureUniqueName(data.name, all_nodes);
      if (uniquename !== data.name) namemap[data.name] = uniquename;
      // Call AddNodeToGraph with uniquenames = false to prevent node renaming
      // (at least until after the graph is expanded)
      const module_type = NodeMapEngine.GetModuleType(
        data.config.config as Record<string, unknown>,
      );

      // New node
      const newnode = {
        id: this.getUniqueNodeID(all_nodes.concat(newnodes)),
        type: 'standard',
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
      const config = this.getNodePropertiesAsJSON(node_from)['config'] as Record<string, unknown>;
      const params = config['config'];
      const output_namespace = params['output_namespace'] ?? params['namespace'];
      newnodes.forEach((node_to) => {
        const config = this.getNodePropertiesAsJSON(node_to)['config'] as Record<string, unknown>;
        const params = config['config'];
        const input_namespace = params['input_namespace'];
        if (typeof input_namespace === 'string') {
          // string = single input port
          if (output_namespace === input_namespace) {
            const newedge = {
              id: this.getUniqueEdgeID(all_edges),
              source: node_from.id,
              sourceHandle: 'Out',
              target: node_to.id,
              targetHandle: 'In',
            };
            all_edges.push(newedge);
          }
        } else {
          // record = multiple input ports
          for (const key in input_namespace) {
            if (output_namespace === input_namespace[key]) {
              const newedge = {
                id: this.getUniqueEdgeID(all_edges),
                source: node_from.id,
                sourceHandle: 'Out',
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
      const port_name_list = node_label.split('$');
      const targetnode_name = port_name_list[0];
      let port_name = '';
      if (port_name_list.length == 1) {
        port_name = 'In';
      } else if (port_name_list.length == 2) {
        if (port_name_list[1] === '') {
          port_name = 'In';
        } else {
          port_name = port_name_list[1];
        }
      } else {
        throw new Error('Recursive port naming not yet supported.');
      }
      const target_node = this.getNodeByName(targetnode_name, newnodes);
      const newedge = {
        id: this.getUniqueEdgeID(all_edges),
        source: node_from.id,
        sourceHandle: 'Out',
        target: target_node.id,
        targetHandle: port_name,
      };
      all_edges.push(newedge);
    }

    // Map output connections from sub-graph
    const config = this.getNodePropertiesAsJSON(node)['config'] as Record<string, unknown>;
    const output_namespace = config['config']['output_namespace'] ?? config['config']['namespace'];
    const target_node_and_port = this.getNodeOutputNodes(node, all_nodes, all_edges);
    for (let i = 0; i < target_node_and_port.length; i++) {
      const target_node = target_node_and_port[i][0];
      const target_port = target_node_and_port[i][1];
      // Lookup output port in sub-graph
      newnodes.forEach((node_from) => {
        const config = this.getNodePropertiesAsJSON(node_from)['config'] as Record<string, unknown>;
        const namespace = config['config']['output_namespace'] ?? config['config']['namespace'];
        if (namespace == output_namespace) {
          console.log('Found output namespace: ' + namespace);
          const newedge = {
            id: this.getUniqueEdgeID(all_edges),
            source: node_from.id,
            sourceHandle: 'Out',
            target: this.getNodeByName(target_node, nodes).id,
            targetHandle: target_port,
          };
          all_edges.push(newedge);
        }
      });
    }

    // Delete expanded node (and connected edges)
    all_nodes = all_nodes.filter((item) => item.data.config.name !== name);
    all_edges = all_edges
      .filter((item) => item.source !== node.id)
      .filter((item) => item.target !== node.id);

    // Ensure unique names (subgraph was expanded without renaming so may
    //   clash with existing nodes)
    // Replace node names in newnode configs (namespaces)
    newnodes.forEach((node) => {
      const json = JSON.parse(JSON.stringify(this.getNodePropertiesAsJSON(node)));
      const outerconfig = json.config as Record<string, unknown>;
      const config = outerconfig['config'] as Record<string, unknown>;
      for (const key in config) {
        if (key == 'output_namespace' || key == 'namespace') {
          if (Object.keys(namemap).includes(config[key] as string)) {
            config[key] = namemap[config[key] as string];
          }
        }
        if (key === 'input_namespace') {
          const input_namespace = config[key];
          if (typeof input_namespace === 'string') {
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
        console.log('(expand) substitution: ' + nodename + ' -> ' + namemap[nodename]);
        this.setNodeName(node, namemap[nodename]);
      }
    });

    // Concatenate new nodes with existing nodes
    all_nodes = all_nodes.concat(newnodes);
    return [all_nodes, all_edges];
  }

  public static GetModuleType(config: Record<string, unknown>): string {
    for (const key in config) {
      if (key === 'input_namespace') {
        const value = config[key];
        if (value === null) {
          return 'source';
        }
      }
    }
    return 'module';
  }

  public static GetModuleTypeColor(type: string): string {
    let color = '';
    switch (type) {
      case 'disabled': {
        color = '#8b8c89';
        break;
      }
      case 'source': {
        color = '#44aa44';
        break;
      }
      case 'module': {
        color = '#006daa';
        break;
      }
      case 'connector': {
        color = 'rgb(0,255,192)';
        break;
      }
      case 'terminal': {
        color = 'rgb(192,0,255)';
        break;
      }
      default: {
        color = 'rgb(128,128,128)';
        break;
      }
    }
    return color;
  }
}
