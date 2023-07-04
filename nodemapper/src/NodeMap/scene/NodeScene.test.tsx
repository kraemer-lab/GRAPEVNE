import NodeScene from "./NodeScene";
import { DiagramEngine } from "@projectstorm/react-diagrams";
import { DefaultNodeModel } from "NodeMap";
import { DefaultPortModel } from "NodeMap";
import { DefaultLinkModel } from "NodeMap";

test("addNode", () => {
  const nodeScene = new NodeScene();
  const userconfig = JSON.parse(
    JSON.stringify({
      userconfig: {
        key1: "value1",
        key2: "value2",
      },
    })
  );
  const node = nodeScene.addNode(
    "test_name", // name
    "rgb(1,2,3)", // color
    [10, 20], // pos
    userconfig // config
  );
  expect(node.getOptions().name).toEqual("test_name");
  expect(node.getOptions().color).toEqual("rgb(1,2,3)");
  expect(node.getOptions().extras).toEqual(JSON.stringify(userconfig));
});

test.skip("addLink", () => {
  /*addLink(
    port_from: DefaultPortModel,
    port_to: DefaultPortModel
  )*/
});

test("getNodeUserConfig", () => {
  const nodeScene = new NodeScene();
  const userconfig = JSON.parse(
    JSON.stringify({
      id: "idcode",
      name: "Node",
      type: "module",
      config: {
        config: {
          input_namespace: "in",
          output_namespace: "out",
        },
      },
    })
  );
  const node = nodeScene.addNode(
    "Node", // name
    "rgb(255,0,0)", // color
    [0, 0], // pos
    userconfig // config
  );
  const config = nodeScene.getNodeUserConfig(node);
  expect(config).toEqual(userconfig);
});

test.skip("isNodeTypeRule", () => {
  //isNodeTypeRule(node)
});

test.skip("getNodeName", () => {
  //getNodeName(node): string
});

test.skip("InitializeScene", () => {
  //InitializeScene(): void
});

test.skip("distributeModel", () => {
  //distributeModel(model)
});

test.skip("clearModel", () => {
  //clearModel();
});

test.skip("serializeModel", () => {
  //serializeModel()
});

test.skip("getNodeInputNodes", () => {
  //getNodeInputNodes(node: DefaultNodeModel): Record<string, DefaultNodeModel>
});

test.skip("getModuleListJSON", () => {
  //getModuleListJSON(): Record<string, unknown>[]
});

test.skip("getModuleListJSONFromNodeNames", () => {
  //getModuleListJSONFromNodeNames(nodenames: string[]): Record<string, unknown>[]
});

test("getNodeInputNodes ()", () => {
  const nodeScene = new NodeScene();
  const node1 = new DefaultNodeModel(
    "Node 1", // name
    "rgb(255,0,0)", // color
    JSON.stringify({
      // config
      id: "idcode",
      name: "test_name_1",
      type: "module",
      config: {
        config: {
          input_namespace: "in1",
          output_namespace: "out1",
        },
      },
    })
  );
  node1.addInPort("in");
  node1.addOutPort("out");
  const node2 = new DefaultNodeModel(
    "Node 1", // name
    "rgb(255,0,0)", // color
    JSON.stringify({
      // config
      id: "idcode",
      name: "test_name_1",
      type: "module",
      config: {
        config: {
          input_namespace: "in1",
          output_namespace: "out1",
        },
      },
    })
  );
  node2.addInPort("in");
  node2.addOutPort("out");

  // No ports connected
  let ports = nodeScene.getNodeInputNodes(node2);
  expect(ports).toEqual({});

  // One port connected
  nodeScene.addLink(
    node1.getPort("out") as DefaultPortModel,
    node2.getPort("in") as DefaultPortModel
  );
  ports = nodeScene.getNodeInputNodes(node2);
  expect(ports).toEqual({ in: "test_name_1" });
});

test("getModuleListJSON (connect output to single input)", () => {
  const nodeScene = new NodeScene();

  const node1 = new DefaultNodeModel(
    "Node 1", // name
    "rgb(255,0,0)", // color
    JSON.stringify({
      // config
      id: "idcode",
      name: "Node 1",
      type: "module",
      config: {
        config: {
          input_namespace: "in1",
          output_namespace: "out1",
        },
      },
    })
  );
  node1.addInPort("in");
  node1.addOutPort("out");

  const node2 = new DefaultNodeModel(
    "Node 2", // name
    "rgb(0,255,0)", // color
    JSON.stringify({
      // config
      id: "idcode",
      name: "Node 2",
      type: "module",
      config: {
        config: {
          input_namespace: "in2",
          output_namespace: "out2",
        },
      },
    })
  );
  node2.addInPort("in");
  node2.addOutPort("out");

  const link12 = new DefaultLinkModel();
  link12.setSourcePort(node1.getPort("out"));
  link12.setTargetPort(node2.getPort("in"));

  nodeScene.engine.getModel().addAll(node1, node2, link12);

  const js: Record<string, unknown>[] = nodeScene.getModuleListJSON();
  const expected = [
    {
      id: "idcode",
      name: "Node 1",
      type: "module",
      config: {
        config: {
          input_namespace: "in1",
          output_namespace: "out1",
        },
      },
    },
    {
      id: "idcode",
      name: "Node 2",
      type: "module",
      config: {
        config: {
          input_namespace: "in2",
          output_namespace: "out2",
        },
      },
    },
    {
      name: "Join [Node 2]",
      type: "connector",
      config: {
        map: ["Node 1", "Node 2"],
      },
    },
  ];
  expect(js).toEqual(expected);
});

test("getModuleListJSON (connect output to one of a pair of inputs)", () => {
  const nodeScene = new NodeScene();

  const node1 = new DefaultNodeModel(
    "Node 1", // name
    "rgb(255,0,0)", // color
    JSON.stringify({
      // config
      id: "idcode",
      name: "Node 1",
      type: "module",
      config: {
        config: {
          input_namespace: "in1",
          output_namespace: "out1",
        },
      },
    })
  );
  node1.addInPort("in");
  node1.addOutPort("out");

  const node2 = new DefaultNodeModel(
    "Node 2", // name
    "rgb(0,255,0)", // color
    JSON.stringify({
      // config
      id: "idcode",
      name: "Node 2",
      type: "module",
      config: {
        config: {
          input_namespace: {
            in2A_key: "in2A_value",
            in2B_key: "in2B_value",
          },
          output_namespace: "out2",
        },
      },
    })
  );
  node2.addInPort("in2A_key");
  node2.addInPort("in2B_key");
  node2.addOutPort("out");

  const link12 = new DefaultLinkModel();
  link12.setSourcePort(node1.getPort("out"));
  link12.setTargetPort(node2.getPort("in2A_key"));

  nodeScene.engine.getModel().addAll(node1, node2, link12);

  const js: Record<string, unknown>[] = nodeScene.getModuleListJSON();
  const expected = [
    {
      config: {
        config: {
          input_namespace: "in1",
          output_namespace: "out1",
        },
      },
      id: "idcode",
      name: "Node 1",
      type: "module",
    },
    {
      config: {
        config: {
          input_namespace: {
            in2A_key: "in2A_value",
            in2B_key: "in2B_value",
          },
          output_namespace: "out2",
        },
      },
      id: "idcode",
      name: "Node 2",
      type: "module",
    },
    {
      config: {
        map: [
          {
            in2A_key: "Node 1",
          },
          "Node 2",
        ],
      },
      name: "Join [Node 2]",
      type: "connector",
    },
  ];
  expect(js).toEqual(expected);
});

test.skip("buildMapWithSnippets", () => {
  //buildMapWithSnippets(data: JSON);
});

test.skip("markNodesWithoutConnectionsAsComplete", () => {
  //markNodesWithoutConnectionsAsComplete(data);
});
