import React from "react";
import BuilderEngine from "../BuilderEngine";

import { Node } from "./Flow";
import { getNodeById } from "./Flow";
import { getNodeName } from "./Flow";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";
import { builderUpdateNode } from "redux/actions";
import { getAllLinks } from "./HighlightedJSON";

import Button from '@mui/material/Button';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';

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

interface INodeParametersProps{
  node: Node;
  keylist: string[];
}

interface IModuleEntryProps{
  label: string;
  node: Node;
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

  const node_to = getNodeById(id, nodes);
  const node_name = getNodeName(node_to);
  const dispatch = useAppDispatch();
  let nodeId = 0;

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
        label: getNodeName(node_to),
        node: node_to
      };
    }
  }
  

  // Get parameter pairs from node - TODO: replace this bit
  const json = JSON.parse(JSON.stringify(node_to))["data"]["config"]["config"];
  const links = getAllLinks(json);
  console.debug("All link: ", links);

  // Handle parameter selection
  const onParameterSelect = (node_from: Node, keylist_from, key_from: string) => {

    // Determine source parameter name/list
    const param_from = [node_from.data.config.name, ...keylist_from, key_from];

    // Determine target parameter name/list
    const param_to = [...keylist.slice(1, keylist.length), keyitem];

    // Add pairing between 'key/keylist' param and selection, into node.id
    const newnode_to = JSON.parse(JSON.stringify(node_to));
    const node_config = newnode_to.data.config.config;
    let pmap = node_config;
    for(let i = 0; i < keylist.length; i++) {
      if (pmap[keylist[i]] === undefined)
        throw new Error("ParameterList: Keylist not found in node");
      pmap = pmap[keylist[i]];
    }
    let pmap_metadata = pmap[':' + keyitem];  // metadata record
    if (pmap_metadata === undefined) {
      pmap[':' + keyitem] = {};
      pmap_metadata = pmap[':' + keyitem];
    }
    pmap_metadata["link"] = param_from;

    // Update node with new parameter map
    newnode_to.data.config.config = node_config;
    dispatch(builderUpdateNode(newnode_to));
    onclose();
  }

  // Handle parameter removal
  const onRemoveMapping = () => {
    // Remove pairing between 'key/keylist' param and selection, into node.id
    const newnode_to = JSON.parse(JSON.stringify(node_to));
    let pmap = newnode_to.data.config.config["parameter_map"];
    if (pmap === undefined) {
      pmap = [];
    }
    pmap = pmap.filter((pair) => {
      return pair["to"][pair["to"].length-1] !== keyitem;
    });
    newnode_to.data.config.config["parameter_map"] = pmap;
    dispatch(builderUpdateNode(newnode_to));
    onclose();
  }

  const NodeParameters = ({ node, keylist }: INodeParametersProps) => {

    // Isolate current branch in the json tree (indexed by keylist)
    const json = JSON.parse(JSON.stringify(node))["data"]["config"]["config"];
    let jsonObj = json;
    for (let i = 0; i < keylist.length; i++) {
      jsonObj = jsonObj[keylist[i]];
    }
    // Map the JSON sub-fields to a list of rendered elements
    const fieldlist = Object.keys(jsonObj).map((key) => {
      const value = jsonObj[key];
      const valueType: string = typeof value;
      const isSimpleValue =
        ["string", "number", "boolean"].includes(valueType) || !value;

      return (
        <>
          {
            (isSimpleValue) ? (
              <TreeItem
                key={node.id + "__" + [...keylist, key].join("/")}
                nodeId={(nodeId++).toString()}
                label={key + ": " + value}
                onClick={() => onParameterSelect(node, keylist, key)}
              />
            ) : (
              <TreeItem
                key={node.id + "__" + [...keylist, key].join("/")}
                nodeId={(nodeId++).toString()}
                label={key}
              >
                <NodeParameters node={node} keylist={[...keylist, key]} />
              </TreeItem>
            )
          }
        </>
      );
    });
    return <>{fieldlist}</>;
  }

  const ModuleEntry = ({ label, node }: IModuleEntryProps) => (
    <div
      key={node.id}
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
          <small>{node.data.config.name}</small>
        </div>
      </div>
      <div
        key={node.id + "_p"}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "3px",
        }}
      >
        <TreeView>
          <NodeParameters node={node} keylist={[]} />
        </TreeView>
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
        }}
      >
        {
          Object.keys(input_nodes).map((node_id) => {
            return ModuleEntry({
              label: input_nodes[node_id].label,
              node: input_nodes[node_id].node
            });
          })
        }
      </div>
    </div>
  );
}
