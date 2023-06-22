import yaml from "js-yaml";

const get = (object: any, key: string, default_value: any) => {
  const result = object[key as keyof typeof object];
  return typeof result !== "undefined" ? result : default_value;
};

class Node {
  // Node class for use with the workflow Model

  name: string;
  rulename: string;
  nodetype: string;
  snakefile: string;
  params: any;
  input_namespace: string | object;
  output_namespace: string;

  constructor(
    name: string,
    rulename: string,
    nodetype = "module",
    snakefile = "",
    params: any = {},
    input_namespace: string | object = "",
    output_namespace = ""
  ) {
    /* Initialise a Node object, the parent class for Modules, Connector, etc.
     *
     * Args:
     *    name (str): Name of the node
     *    rulename (str): Name of the rule
     *    nodetype (str): Type of node (module, connector, etc.)
     *    snakefile (str): URL of the Snakefile
     *    params (dict): Parameters for the Snakefile
     *    input_namespace (str): Input namespace
     *    output_namespace (str): Output namespace
     */
    this.name = name;
    this.rulename = rulename;
    this.nodetype = nodetype;
    this.snakefile = snakefile;
    this.params = params;
    this.input_namespace = input_namespace;
    this.output_namespace = output_namespace;
  }

  GetOutputNamespace() {
    // Returns the output namespace
    return this.output_namespace;
  }

  GetInputNamespace() {
    // Returns the input namespace
    return this.input_namespace;
  }
}

class Module extends Node {
  // Module class for use with the workflow Model

  constructor(name: string, ...args: any) {
    super(name, args);
  }
}

class Model {
  // Model class for use with the workflow Model

  nodes: Array<Node>;

  constructor() {
    this.nodes = [];
  }

  BuildSnakefile(configfile = "config/config.yaml"): string {
    // Build the Snakefile from the nodes
    let s = "";
    if (configfile !== "") s += `configfile: "${configfile}"\n\n`;
    // Add the modules
    for (const node of this.nodes) {
      s += `module ${node.rulename}:\n`;
      s += `  snakefile:\n`;
      if (typeof node.snakefile === "string") {
        s += `    config["${node.rulename}"]["snakefile"]\n`;
      } else {
        s += `        eval(\n`;
        s += `            f'{{config["${node.rulename}"]["snakefile"]["function"]}}'\n`;
        s += `            '(*config["${node.rulename}"]["snakefile"]["args"],'\n`;
        s += `            '**config["${node.rulename}"]["snakefile"]["kwargs"])'\n`;
        s += `        )\n`;
      }
      s += `  config:\n`;
      s += `    config["${node.rulename}"]["config"]\n`;
      s += `use rule * from ${node.rulename} as ${node.rulename}_*\n`;
      s += `\n`;
    }
    return s;
  }

  BuildSnakefileConfig(): string {
    const c = this.ConstructSnakefileConfig();
    return yaml.dump(c);
  }

  ConstructSnakefileConfig() {
    const c: Record<string, any> = {};
    for (const node of this.nodes) {
      const cnode = node.params.clone();

      // Input namespace
      cnode.input_namespace = get(
        cnode,
        "input_namespace",
        node.input_namespace
      );
      if (typeof cnode["input_namespace"] === "string")
        cnode["input_namespace"] = node["input_namespace"];
      else {
        if (typeof node["input_namespace"] === "object")
          node["input_namespace"] = {};
        for (const key in node.input_namespace as any[]) {
          if (get(node.input_namespace, key, null) !== null)
            cnode.input_namespace[key] =
              node.input_namespace[key as keyof typeof node.input_namespace];
          // Don't use the input namespace if it's empty
          if (cnode.input_namespace[key] === null)
            cnode.input_namespace[key] = key;
        }
      }

      // Output namespace
      cnode["output_namespace"] = node.output_namespace;

      // Save
      c[node.rulename] = {
        config: cnode,
        snakefile: node.snakefile,
      };
    }
  }

  SaveWorkflow() {
    // TODO: Save workflow
  }

  WrangleName(basename: string, subname = ""): string {
    // Wrangle a name
    const rulename = this.WrangleRuleName(basename);
    let name = rulename;
    if (subname !== "") name += `_${subname}`;
    // TODO: Check back over this
    return name;
  }

  WrangledNameList(): string[] {
    const names = this.nodes
      .map((node: Node) => node.output_namespace)
      .filter((output_namespace: string) => output_namespace !== "");
    return names as string[];
  }

  WrangleRuleName(name: string): string {
    // Wrangle a rule name
    return name
      .replace(" ", "_")
      .replace("/", "_")
      .replace(".", "_")
      .replace("(", "")
      .replace(")", "")
      .toLowerCase();
  }

  AddModule(name: string, module: Record<string, any>): Module {
    const kwargs = module.clone();
    if (!Object.keys(kwargs).includes("rulename"))
      kwargs["rulename"] = this.WrangleRuleName(name);
    const node = new Module(name, ...kwargs);
    this.nodes.push(node);
    node.output_namespace = this.WrangleName(node.name);
    return node;
  }

  AddConnector(name: string, connector: Record<string, any>) {
    // Add a connector between modules
    const mapping: any[] = get(connector, "map", []);
    const node_to = this.GetNodeByName(mapping[1] as string);
    if (node_to === null)
      throw `Node ${mapping[1]} not found when attempting to connect modules`;
    if (typeof mapping[0] === "string") {
      const node_from = this.GetNodeByName(mapping[0]);
      if (node_from === null)
        throw `Node ${mapping[0]} not found when attempting to connect modules`;
      node_to.input_namespace = node_from.output_namespace;
    } else {
      node_to.input_namespace = {};
      const ins: Record<string, string> = {};
      for (const key in mapping[0]) {
        const val = mapping[0][
          key as keyof typeof mapping[0]
        ] as unknown as string;
        const incoming_node = this.GetNodeByName(val);
        if (incoming_node === null)
          throw `Node ${val} not found when attempting to connect modules`;
        ins[key] = incoming_node.output_namespace;
        node_to.input_namespace = ins;
      }
    }
  }

  GetNodeByName(name: string): Node | null {
    for (const node of this.nodes) {
      if (node.name === name) return node;
    }
    return null;
  }

  NodeIsTerminus(node: Node): boolean {
    // Check if a node is a terminus
    for (const n of this.nodes) {
      let nodes_in: object | string = n.input_namespace;
      if (typeof nodes_in === "string") nodes_in = { in: nodes_in };
      if (Object.values(nodes_in).includes(node.name)) return false;
    }
    return true;
  }

  ExpandModule(name: string) {
    //TODO: Expand a module
    // Read module spec (Snakefile, configfile) from source
    // Delete module from Model
    // Add new nodes to Model, preserving connections
    // (ensure consistency of input and output namespaces at parent level)
  }

  GetModuleNames(): string[] {
    return this.nodes.map((node: Node) => node.name);
  }
} // classo

export const YAMLToConfig = (content: string): string => {
  // Convert YAML to Python dict config
  const yl = yaml.load(content);

  // TODO

  const c = "";
  return c;
};

export const BuildFromFile = async (filename: string): Promise<Model> => {
  // TODO
  return new Model();
};

export const BuildFromJSON = async (
  config: Object, // eslint-disable-line @typescript-eslint/ban-types
  singlefile = false
): Promise<[string, Model]> => {
  const m = new Model();

  // Add modules first to ensure all namespaces are defined before connectors
  Object.values(config)
    .filter(
      (module: Record<string, any>) =>
        module["type" as keyof object] === "module"
    )
    .forEach((module: Record<string, any>) => {
      m.AddModule(
        module["name" as keyof object],
        module["config" as keyof object]
      );
    });

  // Add connectors
  Object.values(config)
    .filter(
      (module: Record<string, any>) =>
        module["type" as keyof object] === "connector"
    )
    .forEach((module: Record<string, any>) => {
      m.AddConnector(
        module["name" as keyof object],
        module["config" as keyof object]
      );
    });

  // Return the model as a single file (string) or zip-archive
  if (singlefile) {
    // Composite string
    return [
      YAMLToConfig(m.BuildSnakefileConfig()) + "\n" + m.BuildSnakefile(""),
      m,
    ];
  } else {
    // Create (zipped) workflow and return as binary object
    m.SaveWorkflow();
    const zipfilename = "build";
    // TODO
    const contents = "";
    return [contents, m];
  }
};

// -------
// Which file should these go in?

export const CheckNodeDependencies = async () => {
  return {};
};
