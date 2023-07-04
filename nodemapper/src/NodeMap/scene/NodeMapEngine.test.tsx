import NodeMapEngine from "./NodeMapEngine";
import { DefaultNodeModel } from "NodeMap";
import { DefaultPortModel } from "NodeMap";

test.skip("QueryAndLoadTextFile", () => {
  //
});

test("ClearScene", () => {
  const engine = new NodeMapEngine();
  add_three_connected_nodes(engine);
  let nodelist = getNodeConfigs(engine);
  expect(nodelist).toHaveLength(3);
  engine.ClearScene();
  nodelist = getNodeConfigs(engine);
  expect(nodelist).toHaveLength(0);
});

test.skip("LoadScene", () => {
  //
});

test.skip("SaveScene", () => {
  //
});

test.skip("Download", () => {
  //
});

// TODO: Node ID is fixed in NodeMapEngine.tsx (and not used elsewhere)
test.skip("getNodeById", () => {
  const engine = new NodeMapEngine();
  add_three_connected_nodes(engine);
  const nodelist = getNodeConfigs(engine);
  const id = nodelist[1].id;
  const node = engine.getNodeById(id);
  expect(node.getOptions()["id"]).toMatch(id);
});

test("getNodeByName", () => {
  const engine = new NodeMapEngine();
  add_three_connected_nodes(engine);
  const nodelist = getNodeConfigs(engine);
  const name = nodelist[1].name; // name may be wrangled to be unique
  const node = engine.getNodeByName(name);
  expect(node.getOptions()["name"]).toMatch(name);
});

test("getNodePropertiesAsJSON", () => {
  const engine = new NodeMapEngine();
  const node = add_one_node_custom_config(engine, {
    name: "test_name1_node", // graph node properties
    type: "test_type1_node",
    config: {
      name: "test_name1_workflow", // workflow properties
      type: "test_type1_workflow",
      snakefile: "test_snakefile1_workflow",
      config: {},
    },
  });
  const json = engine.getNodePropertiesAsJSON(node);
  expect(json["name"]).toMatch("test_name1_node");
});

test.skip("getNodePropertiesAsStr", () => {
  //
});

test("getProperty", () => {
  const engine = new NodeMapEngine();
  const node = add_one_node_custom_config(engine, {
    name: "test_name1_node", // graph node properties
    type: "test_type1_node",
    config: {
      name: "test_name1_workflow", // workflow properties
      type: "test_type1_workflow",
      snakefile: "test_snakefile1_workflow",
      config: {},
    },
  });
  expect(engine.getProperty(node, "name")).toMatch("test_name1_node");
  expect(engine.getProperty(node, "type")).toMatch("test_type1_node");
  const config = engine.getProperty(node, "config");
  expect(config["name"]).toMatch("test_name1_workflow");
  expect(config["type"]).toMatch("test_type1_workflow");
  expect(config["snakefile"]).toMatch("test_snakefile1_workflow");
});

test.skip("ConstructMapFromBlocks", () => {
  //
});

test.skip("MarkNodesWithoutConnectionsAsComplete", () => {
  //
});

test.skip("ZoomToFit", () => {
  //
});

test.skip("RedistributeModel", () => {
  //
});

test.skip("GetModuleListJSON", () => {
  //
});

test.skip("AddSelectionListeners", () => {
  //
});

test("AddNodeToGraph", () => {
  const engine = new NodeMapEngine();
  add_three_connected_nodes(engine);
  const nodelist = getNodeConfigs(engine);
  expect(nodelist).toHaveLength(3);
  expect(nodelist[0].name).toMatch(/^test_name1/); // actual (full) name may be
  expect(nodelist[1].name).toMatch(/^test_name2/); //  wrangled to be unique
  expect(nodelist[2].name).toMatch(/^test_name3/);
});

test("ExpandNodeByName", () => {
  // Construct a graph with one multi-module node receiving input from a simple
  // node and outputting to a simple node.
  const engine = new NodeMapEngine();
  const node1 = add_one_node(engine);
  const node2 = add_one_node_custom_config(
    engine,
    {
      name: "test_name2", // graph node properties
      type: "module",
      config: {
        name: "test_name2", // workflow properties
        type: "module",
        snakefile: "test_snakefile2",
        config: {
          // config(params) for workflow
          input_namespace: {
            test_name2a$: "in2a",
          }, // input to sub_module1
          output_namespace: "out2c",
          // module encapsulates three sub-modules
          // (ensure sub-module namespaces connect to each other)
          test_name2a: node_data_workflow(
            "test_id2a",
            "test_name2a",
            "module",
            "test_snakefile2a",
            "in2a",
            "out2a"
          ),
          test_name2b: node_data_workflow(
            "test_id2b",
            "test_name2b",
            "module",
            "test_snakefile2b",
            "out2a",
            "out2b"
          ),
          test_name2c: node_data_workflow(
            "test_id2c",
            "test_name2c",
            "module",
            "test_snakefile2c",
            "out2b",
            "out2c"
          ),
        },
      },
    },
    false
  );
  const node3 = add_one_node(engine);
  const link12 = engine.nodeScene.addLink(
    node1.getPort("Out") as DefaultPortModel,
    node2.getPort("test_name2a$") as DefaultPortModel
  );
  const link23 = engine.nodeScene.addLink(
    node2.getPort("Out") as DefaultPortModel,
    node3.getPort("In") as DefaultPortModel
  );
  expect(engine.engine.getModel().getNodes()).toHaveLength(3);
  // Expand multi-module node
  const name = node2.getOptions().name; // name may be wrangled
  engine.ExpandNodeByName(name);
  expect(engine.engine.getModel().getNodes()).toHaveLength(5);
});

// Utility functions

const getNodeConfigs = (engine: NodeMapEngine) => {
  const nodes = engine.engine.getModel().getNodes();
  return nodes.map((node) => {
    return JSON.parse(node.getOptions().extras);
  });
};

const add_one_node = (engine: NodeMapEngine) => {
  const n = engine.engine.getModel().getNodes().length + 1;
  return add_one_node_custom_config(
    engine,
    node_data(
      "test_id" + n,
      "test_name" + n,
      "module",
      "test_snakefile" + n,
      "in" + n,
      "out" + n
    )
  );
};

const add_one_node_custom_config = (
  engine: NodeMapEngine,
  config: Record<string, any>,
  uniquenames = true
) => {
  const point = { x: 0.1, y: 0.2 };
  const color = "rgb(1.0,2.0,3.0)";
  return engine.AddNodeToGraph(config, point, color, uniquenames);
};

const add_three_connected_nodes = (engine: NodeMapEngine) => {
  const point = { x: 0.1, y: 0.2 };
  const color = "rgb(1.0,2.0,3.0)";
  const uniquenames = true;
  const node1 = add_one_node(engine);
  const node2 = add_one_node(engine);
  const node3 = add_one_node(engine);
  const link12 = engine.nodeScene.addLink(
    node1.getPort("In") as DefaultPortModel,
    node2.getPort("Out") as DefaultPortModel
  );
  const link23 = engine.nodeScene.addLink(
    node2.getPort("In") as DefaultPortModel,
    node3.getPort("Out") as DefaultPortModel
  );
};

const node_data = (
  id = "test_id",
  name = "test_name",
  type = "test_type",
  snakefile = "test_snakefile",
  input_namespace = "test_input_namespace",
  output_namespace = "test_output_namespace"
) => {
  return {
    id: id, // graph node properties
    name: name,
    type: type,
    config: node_data_workflow(
      id,
      name,
      type,
      snakefile,
      input_namespace,
      output_namespace
    ),
  };
};

const node_data_workflow = (
  id = "test_id",
  name = "test_name",
  type = "test_type",
  snakefile = "test_snakefile",
  input_namespace = "test_input_namespace",
  output_namespace = "test_output_namespace"
) => {
  return {
    id: id,
    name: name,
    type: type,
    snakefile: snakefile,
    config: {
      input_namespace: input_namespace,
      output_namespace: output_namespace,
    },
  };
};
