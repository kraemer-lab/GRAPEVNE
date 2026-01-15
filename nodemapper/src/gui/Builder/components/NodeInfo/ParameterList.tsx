import React from 'react';

import { ModuleType } from 'NodeMap/scene/Module';
import { builderNodeSelected, builderUpdateNode } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { Edge, Node, getNodeById, getNodeName } from './../Flow';

import {
  checkParameter_IsInModuleConfigLayer,
  checkParameter_IsModuleRoot,
  lookupKey,
} from './HighlightJSON';

import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { styled } from '@mui/material/styles';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/GridLegacy';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';

const protectedNames = ['input_namespace', 'ports', 'output_namespace', 'namespace'];

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

interface INodeParametersProps {
  node: Node;
  keylist: string[];
}

interface IModuleEntryProps {
  label: string;
  node: Node;
}

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  overflow: 'auto',
  color: theme.palette.text.secondary,
}));

type InputNodesType = Record<string, { label: string; node: Node }>;

const detemineInputNodes = (
  id: string,
  node_to: Node,
  nodes: Node[],
  edges: Edge[],
  showAllNodes: boolean,
  showSelfNodes: boolean,
): InputNodesType => {
  const input_nodes: InputNodesType = {};
  if (showAllNodes) {
    nodes.forEach((n) => {
      input_nodes[n.id] = {
        label: getNodeName(n),
        node: n,
      };
    });
  }
  if (showAllNodes) {
    // Remove self node (if not showing self node)
    if (!showSelfNodes) {
      delete input_nodes[id];
    }
  } else {
    if (showSelfNodes) {
      // Add self node (if showing self node)
      input_nodes[id] = {
        label: getNodeName(node_to),
        node: node_to,
      };
    } else {
      edges.forEach((e) => {
        if (e.target === id) {
          input_nodes[e.targetHandle] = {
            label: e.targetHandle,
            node: getNodeById(e.source, nodes),
          };
        }
      });
    }
  }
  return input_nodes;
};

export default function ParameterList({
  id,
  keylist,
  keyitem,
  onclose,
  ...props
}: ParameterListProps) {
  const nodes = useAppSelector((state) => state.builder.nodes);
  const edges = useAppSelector((state) => state.builder.edges);
  const [showAllNodes, setShowAllNodes] = React.useState(false);
  const [showSelfNodes, setShowSelfNodes] = React.useState(false);

  // Get node, name and parameter pairs
  const node_to = getNodeById(id, nodes);
  const node_json = JSON.parse(JSON.stringify(node_to))['data'] as ModuleType;
  const json = node_json?.config?.config ?? null;
  if (json === null) {
    return null;
  }
  const node_name = getNodeName(node_to);
  const dispatch = useAppDispatch();
  let nodeId = 0;

  // Format keyitem and keylist together
  const keylist_str = [...keylist.slice(2, keylist.length), keyitem].join('/');
  const keylist_str_full = [node_name, ...keylist, keyitem].join('/');

  // Get list of nodes that are connected as inputs to this node
  const input_nodes = detemineInputNodes(id, node_to, nodes, edges, showAllNodes, showSelfNodes);

  // Determine if parameter is already connected to another parameter
  let isConnected = false;
  const node = getNodeById(id, nodes);
  const module_settings = node.data.config.config;
  const metadata = lookupKey(module_settings, keylist, ':' + keyitem);
  let target_keylist_str = '';
  if (metadata !== undefined) {
    isConnected = metadata['link'] !== undefined;
    if (isConnected) target_keylist_str = metadata['link'].join('/');
  }

  // Handle parameter selection
  const onParameterSelect = (node_from: Node, keylist_from, key_from: string) => {
    const param_from = [node_from.data.config.name, ...keylist_from, key_from];

    // Add pairing between 'key/keylist' param and selection, into node.id
    const newnode_to = JSON.parse(JSON.stringify(node_to));
    const node_config = newnode_to.data.config.config;
    let pmap = node_config;
    for (let i = 0; i < keylist.length; i++) {
      if (pmap[keylist[i]] === undefined)
        throw new Error('ParameterList: Keylist not found in node');
      pmap = pmap[keylist[i]];
    }
    let pmap_metadata = pmap[':' + keyitem]; // metadata record
    if (pmap_metadata === undefined) {
      pmap[':' + keyitem] = {};
      pmap_metadata = pmap[':' + keyitem];
    }
    pmap_metadata['link'] = param_from;

    // Update node with new parameter map
    newnode_to.data.config.config = node_config;
    dispatch(builderUpdateNode(newnode_to));
    dispatch(builderNodeSelected(newnode_to));
  };

  const disconnectParameter = () => {
    console.log('Disconnect parameter: ', keyitem);
    const node = getNodeById(id, nodes);
    const newnode = JSON.parse(JSON.stringify(node));
    const module_settings = newnode.data.config.config;
    const metadata = lookupKey(module_settings, keylist, ':' + keyitem);
    delete metadata['link'];
    if (Object.keys(metadata).length === 0) {
      const parent = lookupKey(
        module_settings,
        keylist.slice(0, keylist.length - 1),
        keylist[keylist.length - 1],
      );
      delete parent[':' + keyitem];
    }
    dispatch(builderUpdateNode(newnode));
    dispatch(builderNodeSelected(newnode));
  };

  const NodeParameters = ({ node, keylist }: INodeParametersProps) => {
    // Isolate current branch in the json tree (indexed by keylist)
    let jsonObj = JSON.parse(JSON.stringify(node))['data']['config']['config'];
    for (let i = 0; i < keylist.length; i++) {
      jsonObj = jsonObj[keylist[i]];
    }

    // Map the JSON sub-fields to a list of rendered elements
    const fieldlist = Object.keys(jsonObj).map((key) => {
      const node_name = getNodeName(node);
      const value = jsonObj[key];
      const valueType: string = typeof value;
      const isSimpleValue = ['string', 'number', 'boolean'].includes(valueType) || !value;
      const isHiddenValue = protectedNames.includes(key) || key.startsWith(':');
      if (isHiddenValue) {
        return null;
      }

      // If the key is a module root, substitute the module 'name' field as the label
      let label = key;
      const isModuleRoot = checkParameter_IsModuleRoot(value);
      if (isModuleRoot) {
        if (jsonObj[key].name !== undefined) {
          label = jsonObj[key].name;
        }
      }

      // If the key is a module config, skip rendering of the key (but render children)
      const isInModuleConfigLayer = checkParameter_IsInModuleConfigLayer(node, keylist);
      if (isInModuleConfigLayer) {
        // Of the parameters in the module config layer, continue rendering only the
        // 'config' children, which contains the actual parameters
        if (key !== 'config') {
          return null;
        } else {
          return (
            <NodeParameters node={node} keylist={[...keylist, key]} key={(nodeId++).toString()} />
          );
        }
      }

      // Determine if parameter is valid
      let canBeConnected = true;
      const identifier = [node_name, ...keylist, key].join('/');
      if (identifier === keylist_str_full) {
        // Is this parameter the originating target?
        canBeConnected = false;
      }

      const DisplaySimpleValue = () => {
        // Is the parameter the target of our already connected parameter?
        const identifier = [node_name, ...keylist, key].join('/');
        if (canBeConnected) {
          if (identifier === target_keylist_str) {
            return (
              <TreeItem
                style={{ color: '#1876d2' }}
                key={node.id + '__' + identifier}
                itemId={(nodeId++).toString()}
                label={key + ': ' + value}
                onClick={() => onParameterSelect(node, keylist, key)}
              >
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<FontAwesomeIcon icon={faTimes} />}
                  size="small"
                  style={{ maxHeight: '25px' }}
                  onClick={disconnectParameter}
                >
                  Disconnect
                </Button>
              </TreeItem>
            );
          } else {
            return (
              <TreeItem
                key={node.id + '__' + identifier}
                itemId={(nodeId++).toString()}
                label={key + ': ' + value}
                onClick={() => onParameterSelect(node, keylist, key)}
              />
            );
          }
        } else {
          return (
            <TreeItem
              style={{ color: '#bebebe' }}
              key={node.id + '__' + identifier}
              itemId={(nodeId++).toString()}
              label={key + ': ' + value}
            />
          );
        }
      };

      return (
        <>
          {isSimpleValue ? (
            <DisplaySimpleValue />
          ) : (
            <TreeItem
              key={node.id + '__' + [...keylist, key].join('/')}
              itemId={(nodeId++).toString()}
              label={label}
            >
              <NodeParameters node={node} keylist={[...keylist, key]} />
            </TreeItem>
          )}
        </>
      );
    });
    return <>{fieldlist}</>;
  };

  const ModuleEntry = ({ label, node }: IModuleEntryProps) => (
    <Item>
      <Box
        key={node.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
          }}
        >
          {showAllNodes || showSelfNodes ? (
            <Box>{'Node: ' + label}</Box>
          ) : (
            <Box>
              {'Port: ' + label}
              <Box>
                <small>{node.data.config.name}</small>
              </Box>
            </Box>
          )}
        </Box>
        <Box
          key={node.id + '_p'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <SimpleTreeView
            defaultExpandedItems={Array.from({ length: 999 }, (_, i) => i.toString())}
          >
            <NodeParameters node={node} keylist={[]} />
          </SimpleTreeView>
        </Box>
      </Box>
    </Item>
  );

  // Handle escape key
  document.onkeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onclose();
    }
  };

  return (
    <Modal open={true}>
      <Box
        {...props}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translate(-50%, -5%)',
          width: '90%',
          height: '90%',
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
        }}
      >
        <Box>
          <big>
            <b>{keylist_str}</b>
          </big>{' '}
          <i>{node_name}</i>
          <span style={{ float: 'right' }}>
            {isConnected && (
              <span>
                <Button
                  id="btnParameterListRemove"
                  variant="outlined"
                  size="small"
                  onClick={disconnectParameter}
                >
                  Disconnect
                </Button>{' '}
              </span>
            )}
            <label htmlFor="checkParameterListShowSelfParams">Show own parameters</label>
            <Checkbox
              id="checkParameterListShowSelfParams"
              onChange={() => setShowSelfNodes(!showSelfNodes)}
              checked={showSelfNodes}
            />
            <label htmlFor="checkParameterListShowAllNodes">Show all nodes</label>
            <Checkbox
              id="checkParameterListShowAllNodes"
              onChange={() => setShowAllNodes(!showAllNodes)}
              checked={showAllNodes}
            />
            <Button
              id="btnParameterListClose"
              variant="outlined"
              style={{ width: '25px', height: '25px', minWidth: '0' }}
              onClick={onclose}
            >
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </span>
        </Box>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Box sx={{ width: '100%', height: '100%', overflowY: 'auto' }}>
            <Grid
              container
              sx={{
                width: '100%',
                height: '100%',
                overflowX: 'hidden',
                overflowY: 'auto',
              }}
              spacing={{
                xs: 4,
                md: 2,
              }}
              columns={{
                xs: 2,
                sm: 8,
                md: 12,
              }}
            >
              {Object.keys(input_nodes).map((node_id) => (
                <Grid key={node_id} xs={2} sm={4} md={4}>
                  <ModuleEntry
                    label={input_nodes[node_id].label}
                    node={input_nodes[node_id].node}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
