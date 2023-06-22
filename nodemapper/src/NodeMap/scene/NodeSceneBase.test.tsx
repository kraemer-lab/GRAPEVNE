import NodeScene from "./NodeScene";
import { DiagramEngine } from "@projectstorm/react-diagrams";
import { DefaultNodeModel } from "NodeMap";
import { DefaultPortModel } from "NodeMap";
import { DefaultLinkModel } from "NodeMap";

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
        params: {
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
        params: {
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
  console.log(js);
  const expected = [
    {
      id: "idcode",
      name: "Node 1",
      type: "module",
      config: {
        params: {
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
        params: {
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
        params: {
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
        params: {
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
  console.log(js);
  const expected = [
    {
      config: {
        params: {
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
        params: {
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
