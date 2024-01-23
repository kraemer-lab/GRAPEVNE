import React from "react";
import BuilderEngine from "../BuilderEngine";

import { Node } from "./Flow";
import { getNodeById } from "./Flow";
import { getNodeName } from "./Flow";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";
import { builderUpdateNode } from "redux/actions";
import { getParameterPairs } from "./HighlightedJSON";

import "./ParameterList.css";

interface ParameterListProps {
  id: string;
  keylist: string[];
  keyitem: string;
  top: number;
  left: number;
  right: number;
  bottom: number;
  onclose: () => void;
}

export default function ParameterList({
  id,
  keylist,
  keyitem,
  top,
  left,
  right,
  bottom,
  onclose,
  ...props
}: ParameterListProps) {
  const nodes = useAppSelector((state) => state.builder.nodes);
  const edges = useAppSelector((state) => state.builder.edges);
  const [showAllNodes, setShowAllNodes] = React.useState(false);
  const [showSelfNodes, setShowSelfNodes] = React.useState(false);

  const node = getNodeById(id, nodes);
  const node_name = getNodeName(node);
  const dispatch = useAppDispatch();

  // Format keyitem and keylist together
  let keylist_str = keylist.slice(2, keylist.length).join('/');
  if (keylist_str.length > 0) {
    keylist_str += "/";
  }
  keylist_str += keyitem;

  // Get list of nodes that are connected as inputs to this node
  const input_nodes: Record<string, {label: string, node: Node}> = {};
  if (showAllNodes) {
    nodes.forEach((n) => {
      input_nodes[n.id] = {
        label: getNodeName(n),
        node: n
      };
    });
    // Remove self node (if not showing self node)
    if (!showSelfNodes) {
      delete input_nodes[id];
    }
  } else {
    edges.forEach((e) => {
      if (e.target === id) {
        input_nodes[e.targetHandle] = {
          label: e.targetHandle,
          node: getNodeById(e.source, nodes)
        };
      }
    });
    // Add self node (if showing self node)
    if (showSelfNodes) {
      input_nodes[id] = {
        label: getNodeName(node),
        node: node
      };
    }
  }
  
  const json = JSON.parse(JSON.stringify(node))["data"]["config"]["config"];
  const parameter_pairs = getParameterPairs(json);
  console.log("Parameter pairs (ParameterList): ", parameter_pairs);

  // Handle parameter selection
  const onParameterSelect = (n: Node, p: string) => {
    /* Example config:
     *
     * module_to:
     *  name: "Module Name"
     *  type: "module"
     *  parameter_map:
     *    - from: ['module_from', 'config', 'params', 'param_name_from']
     *      to: ['module_to', 'config', 'params', 'param_name_to']
     *  config: {...}
     */

    // Determine source parameter name/list
    const param_from = [n.data.config.name, "config", "params", p];

    // Determine target parameter name/list
    const param_to = [...keylist.slice(1, keylist.length), keyitem];

    // Add pairing between 'key/keylist' param and selection, into node.id
    const newnode = JSON.parse(JSON.stringify(node));
    let pmap = newnode.data.config.config["parameter_map"];
    if (pmap === undefined) {
      pmap = [];
    }
    pmap.push({
      from: param_from,
      to: param_to,
    });
    newnode.data.config.config["parameter_map"] = pmap;
    dispatch(builderUpdateNode(newnode));
    onclose();
  }

  // Handle parameter removal
  const onRemoveMapping = () => {
    // Remove pairing between 'key/keylist' param and selection, into node.id
    const newnode = JSON.parse(JSON.stringify(node));
    let pmap = newnode.data.config.config["parameter_map"];
    if (pmap === undefined) {
      pmap = [];
    }
    pmap = pmap.filter((pair) => {
      return pair["to"][pair["to"].length-1] !== keyitem;
    });
    newnode.data.config.config["parameter_map"] = pmap;
    dispatch(builderUpdateNode(newnode));
    onclose();
  }

  const NodeParameters = (label: string, n: Node) => (
    <div
      key={n.id}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0px",
          backgroundColor: "#eee",
        }}
      >
        <div>
          {showAllNodes ? "Node: " + label : "Port: " + label}
        </div>
        <div>
          <small>{n.data.config.name}</small>
        </div>
      </div>
      <div
        key={n.id + "_p"}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "3px",
        }}
      >
        { // List parameters (but only if params structure exists)
          (n.data.config.config.config["params"] !== undefined) ? (
            Object.keys(n.data.config.config.config["params"]).map((p) => {
              // Exclude self parameter from list
              if (n === node && p === keyitem)
                return null;  

              // Signify if parameter is already mapped
              let is_mapped = false;
              parameter_pairs.forEach((pair) => {
                console.log("Pair: ", pair, ", p: ", p);
                if (pair["from"][pair["from"].length-1] === p) {
                  is_mapped = true;
                }
              });
              console.log("Parameter: ", p, ", is_mapped: ", is_mapped);
              if (is_mapped) {
                return (
                  <button
                    key={n.id + "_p_" + p}
                    style={{ color: "red" }}
                    className="btn"
                    onClick={() => onRemoveMapping()}
                  >
                    {p}
                  </button>
                )
              } else {
                // Otherwise, return a parameter button
                return (
                  <button
                    key={n.id + "_p_" + p}
                    className="btn"
                    onClick={() => onParameterSelect(n, p)}
                  >
                    {p}
                  </button>
                )
              }
            })
          ) : (
            <i>No parameters</i>
          )
        }
      </div>
    </div>
  );

  // Handle escape key
  document.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onclose();
    }
  }

  return (
    <div
      style={{ top, left, right, bottom, margin: "5px" }}
      className="parameter-list"
      {...props}
    >
      <p style={{ margin: "0.5em" }}>
        <big><b>{keylist_str}</b></big> <i>{node_name}</i>
        <span style={{ float: "right" }}>
          <label
            htmlFor="checkParameterListShowSelfParams"
          >
            Show own parameters
          </label>
          <input
            type="checkbox"
            id="checkParameterListShowSelfParams"
            onChange={() => setShowSelfNodes(!showSelfNodes)}
            checked={showSelfNodes}
          ></input>
          <label
            htmlFor="checkParameterListShowAllNodes"
          >
            Show all nodes
          </label>
          <input
            type="checkbox"
            id="checkParameterListShowAllNodes"
            onChange={() => setShowAllNodes(!showAllNodes)}
            checked={showAllNodes}
          ></input>
          <button
            id="btnParameterListClose"
            onClick={onclose}
          >
            X
          </button>
        </span>
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px",
          margin: "5px",
        }}
      >
        {
          Object.keys(input_nodes).map((node_id) => {
            return NodeParameters(input_nodes[node_id].label, input_nodes[node_id].node);
          })
        }
      </div>
    </div>
  );
}
