import React from "react";
import BuilderEngine from "../BuilderEngine";

import { Node } from "./Flow";
import { getNodeById } from "./Flow";
import { getNodeName } from "./Flow";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";
import { builderUpdateNode } from "redux/actions";
import { getAllLinks } from "./HighlightedJSON";

import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';

import "./ParameterList.css";

const protectedNames = [
  "input_namespace",
  "output_namespace",
];

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

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  overflow: 'auto',
  color: theme.palette.text.secondary,
}));

const checkParameter_IsModuleRoot = (value) => {
  // Parameter is a module root if it contains a 'snakefile' field
  if (Object.keys(value).includes("snakefile")) {
    return true;
  }
  return false;
};

const checkParameter_IsInModuleConfigLayer = (node, keylist, key) => {
  // Is the parameters parent a module root?
  const json = JSON.parse(JSON.stringify(node))["data"]["config"]["config"];
  let jsonObj = json;
  for (let i = 0; i < keylist.length; i++) {
    jsonObj = jsonObj[keylist[i]];
  }
  if (checkParameter_IsModuleRoot(jsonObj)) {
    return true;
  }
  return false;
};

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
      const isHiddenValue =
        (protectedNames.includes(key) || key.startsWith(":"));
      if (isHiddenValue) {
        return <></>;
      }

      // If the key is a module root, substitute the module 'name' field as the label
      let label = key;
      const isModuleRoot = checkParameter_IsModuleRoot(value);
      if (isModuleRoot) {
        if (jsonObj[key].name !== undefined) {
          label = jsonObj[key].name;
        }
      }

      // If the key is a module config, skip renderin of the key (but render children)
      const isInModuleConfigLayer = checkParameter_IsInModuleConfigLayer(node, keylist, key);
      if (isInModuleConfigLayer) {
        // Of the parameters in the module config layer, continue rendering only the
        // 'config' children, which contains the actual parameters
        if (key !== "config") {
          return <></>;
        } else {
          return (
            <NodeParameters node={node} keylist={[...keylist, key]} key={(nodeId++).toString()} />
          );
        }
      }

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
                label={label}
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
    <Item>
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
          {
            (showAllNodes || showSelfNodes) ? (
              <div>
                {"Node: " + label}
              </div>
            ) : (
              <div>{"Port: " + label}
                <div>
                  <small>{node.data.config.name}</small>
                </div>
              </div>
            )
          }
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
    </Item>
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
      <div style={{width: "100%", height: "100%", backgroundColor: "white"}}>
        <Box sx={{ width: "100%", height: "100%", overflowY: 'auto' }}>
          <Grid container
            spacing={{
              xs: 4,
              md: 2
            }}
            columns={{
              xs: 2,
              sm: 8,
              md: 12
            }}
          >
            {
              Object.keys(input_nodes).map((node_id) => (
                <Grid
                  key={node_id}
                  xs={2}
                  sm={4}
                  md={4}
                >
                  <ModuleEntry
                    label={input_nodes[node_id].label}
                    node={input_nodes[node_id].node}
                  />
                </Grid>
              ))
            }
          </Grid>
        </Box>
      </div>
    </div>
  );
}
