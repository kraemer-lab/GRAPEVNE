import React from "react";
import BuilderEngine from "../BuilderEngine";

import { Node } from "reactflow";
import { getNodeById } from "./Flow";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";
import { builderUpdateNode } from "redux/actions";

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
  const node = getNodeById(id, nodes);
  const node_name = node.data.config.name;
  const dispatch = useAppDispatch();

  // Format keyitem and keylist together
  let keylist_str = keylist.slice(2, keylist.length).join('/');
  if (keylist_str.length > 0) {
    keylist_str += "/";
  }
  keylist_str += keyitem;

  // Get list of nodes that are connected as inputs to this node
  const input_nodes = edges
    .filter((e) => e.target === id)
    .map((e) => [e.targetHandle, getNodeById(e.source, nodes)]);

  // Handle parameter selection
  const onParameterSelect = (n: Node, p: string) => {
    console.log("ParameterList: onParameterSelect: ", n, p);
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
    const param_to = [node.data.config.name, ...keylist, keyitem];

    /* Add pairing between 'key/keylist' param and selection, into node.id */
    const newnode = JSON.parse(JSON.stringify(node));
    let pmap = newnode.data.config.config["parameter_map"];
    if (pmap === undefined) {
      pmap = [];
    }
    pmap.push({
      from: param_from,
      to: param_to,
    });
    console.log("PList:");
    console.log(newnode);
    newnode.data.config.config["parameter_map"] = pmap;
    dispatch(builderUpdateNode(newnode));
    onclose();
  }

  return (
    <div
      style={{ top, left, right, bottom }}
      className="parameter-list"
      {...props}
    >
      <p style={{ margin: "0.5em" }}>
        <b>{node_name}: {keylist_str}</b>
        <button
          style={{ float: "right" }}
          onClick={onclose}
        >
          X
        </button>
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px",
        }}
      >
        {input_nodes.map((d) => {
          const port = d[0] as string;
          const n = d[1] as Node;
          if (n.id !== id) {
            return(
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
                    Port: {port}
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
                    Object.keys(n.data.config.config.config["params"]).map((p) => (
                        <button
                          key={n.id + "_p_" + p}
                          className="btn"
                          onClick={() => onParameterSelect(n, p)}
                        >
                          {p}
                        </button>
                      ))
                    ) : (
                      <i>No parameters</i>
                    )
                  }
                </div>
              </div>
            );
          } else null;
        })}
      </div>
    </div>
  );
}
