import { DiagramModel } from "@projectstorm/react-diagrams";
import NodeSceneBase from "./NodeSceneBase";

class NodeScene extends NodeSceneBase {
  buildMapWithSnippets(data: JSON) {
    const model = new DiagramModel();
    this.engine.setModel(model);
    const pos = [50, 50];
    this.nodelist = {};
    data["block"].forEach((block) => {
      const node_index: number = block["id"];
      let colstr = "rgb(0,192,255)";
      if (block["type"] == "config") {
        colstr = "rgb(192,0,255)";
      }
      const node = this.addNode(block["name"], colstr, pos, block);
      this.nodelist[block["name"]] = node;
      pos[0] += 150;
      // count and add ports
      let count_ports_in = 0;
      let count_ports_out = 0;
      data["links"]["content"].forEach((link) => {
        if (link[0] == block["name"]) count_ports_out++;
        if (link[1] == block["name"]) count_ports_in++;
      });
      if (block["type"] == "rule") {
        if (count_ports_in > 0) node.addInPort("in");
        if (count_ports_out > 0) node.addOutPort("out");
      }
    });
    data["links"]["content"].forEach((link) => {
      console.debug(link, this.nodelist);
      try {
        this.addLink(
          this.nodelist[link[0]].getPort("out"),
          this.nodelist[link[1]].getPort("in")
        );
      } catch (e) {
        // pass
      }
    });
    // Mark nodes without connections as completed
    for (const key of Object.keys(this.nodelist)) {
      const node = this.nodelist[key];
      const portsIn = node.getInPorts();
      const portsOut = node.getOutPorts();
      if (
        this.isNodeTypeRule(node) &&
        portsIn.length == 0 &&
        portsOut.length == 0
      )
        node.setColor("rgb(0,255,0)");
      else if (this.isNodeTypeRule(node) && portsIn.length == 0)
        node.setColor("rgb(128,255,0)");
      else if (this.isNodeTypeRule(node) && portsOut.length == 0)
        node.setColor("rgb(255,0,255)");
    }
    this.distributeModel(model);
  }

  markNodesWithoutConnectionsAsComplete(data: JSON) {
    for (const key of Object.keys(this.nodelist)) {
      const node = this.nodelist[key];
      // Check if node has any remaining dependencies in the latest DAG
      let has_input = false;
      data["links"]["content"].forEach((link) => {
        if (
          link[0] == this.getNodeName(node) ||
          link[1] == this.getNodeName(node)
        ) {
          has_input = true;
        }
      });
      if (!has_input) node.setColor("rgb(0,255,0)");
    }
  }
}

export default NodeScene;
