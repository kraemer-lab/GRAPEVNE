import _ from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import {
  builderAddNode,
  builderNodeDeselected,
  builderNodeSelected,
  builderSetConfigFiles,
  builderSetEdges,
  builderSetNodes,
  builderSetSelectedNodes,
  builderUpdateStatusText,
} from 'redux/actions';

import ReactFlow, {
  Background,
  Connection,
  Controls,
  EdgeChange,
  MiniMap,
  NodeChange,
  Panel,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import dagre from 'dagre';
import BuilderEngine from './../BuilderEngine';
import GroupContextMenu from './../GroupContextMenu';
import NodeContextMenu from './../NodeContextMenu';
import SelectionContextMenu from './../SelectionContextMenu';

import { Query } from 'api';
import { Edge, Node } from 'NodeMap/scene/Flow'; // Custom Node definition
import { edgeTypes, nodeTypes } from './ModuleTypes';
import { getNodeName } from './Utils';

import 'reactflow/dist/style.css';
import './flow.css';

import * as styles from './flow.module.css';

const builderAPI = window.builderAPI;

const proOptions = {
  hideAttribution: true,
};

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = 'LR',
  node_spacing_x = 150,
  node_spacing_y = 50,
) => {
  // Typical node size for spacing
  const nodeWidth = node_spacing_x;
  const nodeHeight = node_spacing_y;

  // Allow dagre to determine layout
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    marginx: 20,
    marginy: 20,
  });
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);

  // Assign calculated positions to nodes
  const newnodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newnode = JSON.parse(JSON.stringify(node));
    newnode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return newnode;
  });

  return newnodes;
};

const getConfigFiles = async (snakefile: Record<string, unknown> | string): Promise<string[]> => {
  console.log('Getting config files for: ', snakefile);
  return await builderAPI.GetModuleConfigFilesList(snakefile);
};

const Flow = () => {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => state.builder.nodes);
  const edges = useAppSelector((state) => state.builder.edges);
  const layout = useAppSelector((state) => state.settings.layout_direction);
  const edge_type = useAppSelector((state) => state.settings.edge_type);
  const node_spacing_x = useAppSelector((state) => state.settings.node_spacing_x);
  const node_spacing_y = useAppSelector((state) => state.settings.node_spacing_y);
  const snapToGrid = useAppSelector((state) => state.settings.snap_to_grid);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [interactive] = useState(true);
  const [showNodeContextMenu, setShowNodeContextMenu] = useState(null);
  const [showSelectionContextMenu, setShowSelectionContextMenu] = useState(null);
  const [showGroupContextMenu, setShowGroupContextMenu] = useState(null);
  const ref = useRef(null);

  const onNodesChange = (changes: NodeChange[]) => {
    // Allow node removal to be handled by onNodesDelete
    if (changes.some((change) => change.type === 'remove')) {
      return;
    }
    // Otherwise, apply changes to nodes
    dispatch(builderSetNodes(applyNodeChanges(changes, nodes)));
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    dispatch(builderSetEdges(applyEdgeChanges(changes, edges)));
  };

  const onConnect = (connection: Connection) => {
    dispatch(builderSetEdges(addEdge({ ...connection, type: edge_type }, edges)));
  };

  const closeContextMenus = () => {
    setShowNodeContextMenu(null);
    setShowGroupContextMenu(null);
    setShowSelectionContextMenu(null);
  };

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    closeContextMenus();
    dispatch(builderNodeSelected(node));
  };

  const positionContextMenu = (event: React.MouseEvent) => {
    // Position context menu; right-align if it is too close to the edge of the pane
    const pane = ref.current.getBoundingClientRect();
    return {
      top: event.clientY - pane.top < pane.height - 200 && event.clientY - pane.top,
      bottom:
        event.clientY - pane.top >= pane.height - 200 && pane.height - (event.clientY - pane.top),
      left: event.clientX - pane.left < pane.width - 200 && event.clientX - pane.left,
      right:
        event.clientX - pane.left >= pane.width - 200 && pane.width - (event.clientX - pane.left),
    };
  };

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    // Prevent native context menu from showing
    event.preventDefault();
    // Close module parameters pane (if open)
    dispatch(builderNodeDeselected());
    // Open relevant context menu
    if (node.type === 'group') {
      setShowGroupContextMenu({ id: node.id, ...positionContextMenu(event) });
    } else {
      setShowNodeContextMenu({ id: node.id, ...positionContextMenu(event) });
    }
  };

  const RemoveLinkParameters = (removed_nodes: Node[]) => {
    const removed_nodes_names = removed_nodes.map(getNodeName);
    const StripLinks = (config: Record<string, unknown>) => {
      if (config === null || config === undefined) {
        return config;
      }
      const keys = Object.keys(config);
      for (const key of keys) {
        if (key.startsWith(':')) {
          const metadata = config[key] as Record<string, unknown>;
          const link = metadata['link'] as string[];
          if (link === undefined || link === null) {
            continue;
          }
          if (removed_nodes_names.includes(link[0])) {
            delete metadata['link'];
            if (Object.keys(metadata).length === 0) {
              delete config[key];
            }
          }
        } else if (typeof config[key] === 'object') {
          config[key] = StripLinks(config[key] as Record<string, unknown>);
        }
      }
      return config;
    };

    const remaining_nodes = nodes
      .filter((node) => {
        return !removed_nodes.map((n) => n.id).includes(node.id);
      })
      .map((node) => {
        const newnode = JSON.parse(JSON.stringify(node));
        const node_config = newnode.data.config.config.config ?? null;
        if (!node_config) {
          return node_config;
        }
        // Recursively remove links to removed nodes
        const new_node_config = StripLinks(node_config);
        newnode.data.config.config.config = new_node_config;
        return newnode;
      });
    dispatch(builderSetNodes(remaining_nodes));
  };

  const onNodesDelete = (removed_nodes: Node[]) => {
    // Strip any active links to the removed nodes
    RemoveLinkParameters(removed_nodes);
    // Close module parameters pane (if open)
    dispatch(builderNodeDeselected());
    console.log('Removed nodes: ', removed_nodes);
  };

  const onPaneClick = useCallback(() => {
    console.debug('Node pane click');
    // Close context menus (if open)
    closeContextMenus();
    // Close module parameters pane (if open)
    dispatch(builderNodeDeselected());
  }, [dispatch]);

  const onDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('flow-diagram-node');
    // check if the dropped element is valid
    if (typeof type === 'undefined' || !type) {
      return;
    }
    const app = BuilderEngine.Instance;
    const data = JSON.parse(event.dataTransfer.getData('flow-diagram-node'));
    const point = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const color = BuilderEngine.GetModuleTypeColor(data.type as string);
    // Isolate configuration
    const module_name = data.name as string;
    const workflow = data.config as Query;
    const workflow_config = workflow.config as Query;
    // Check if module was provided with a configuration
    document.body.style.cursor = 'wait';
    if (_.isEmpty(workflow_config)) {
      // Module was not provided with a configuration - attempt to load now
      dispatch(builderUpdateStatusText(`Loading module ${module_name}...`));
      // Get repository details from module
      const repo = {};
      if (typeof workflow['snakefile'] === 'string') {
        repo['type'] = 'local';
        repo['repo'] = workflow['snakefile'];
      } else {
        // Assumes github directory listing (not compatible with branch listing)
        repo['type'] = 'github';
        repo['repo'] = workflow['snakefile']['args'][0];
      }
      const query: Record<string, unknown> = {
        query: 'builder/get-remote-module-config',
        data: {
          format: 'Snakefile',
          content: {
            repo: repo,
            snakefile: workflow['snakefile'],
          },
        },
      };
      let snakefile = null;
      if (typeof workflow['snakefile'] === 'string') {
        snakefile = workflow['snakefile'] as string;
      } else {
        snakefile = workflow['snakefile'] as Query;
      }
      const getConfig = async (query) => {
        return await builderAPI.GetRemoteModuleConfig(query);
      };
      getConfig(query)
        .then((config) => {
          // Extract docstring
          const docstring = config['docstring'];
          delete config['docstring'];
          (data.config as Query).config = config;
          (data.config as Query).docstring = docstring;
          // Add node to graph
          const newnode = {
            id: app.getUniqueNodeID(nodes),
            type: 'standard',
            data: {
              color: color,
              config: {
                ...data,
                name: app.EnsureUniqueName(module_name, nodes),
              },
            },
            position: point,
          } as Node;
          // Add node to graph
          dispatch(builderAddNode(newnode));
          dispatch(builderUpdateStatusText(`Module loaded.`));
          // Get configuration file list (alternative config files)
          getConfigFiles(snakefile).then((configfile_list) => {
            dispatch(builderSetConfigFiles(configfile_list));
          });
        })
        .catch((error) => {
          console.error(error);
          dispatch(builderUpdateStatusText(`FAILED to load module ${module_name}.`));
        });
    } else {
      // Module already contains a valid configuration
      const newnode = {
        id: app.getUniqueNodeID(nodes),
        type: 'standard',
        data: {
          config: { ...data, name: app.EnsureUniqueName(module_name, nodes) },
        },
        position: point,
      } as Node;
      dispatch(builderAddNode(newnode));
      // Set configuration file list (alternative config files) empty
      dispatch(builderSetConfigFiles([]));
    }
    document.body.style.cursor = 'default';
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onLayout = useCallback(
    (direction) => {
      const newnodes = getLayoutedElements(nodes, edges, direction, node_spacing_x, node_spacing_y);
      dispatch(builderSetNodes(newnodes));
    },
    [nodes, edges, dispatch],
  );

  // ***********************************************************************************
  // Selection context menu

  const handleSelectionContextMenu = (event) => {
    event.preventDefault();

    // Check if the right-click happened on the selection box
    if (event.target.closest('.react-flow__nodesselection')) {
      setShowSelectionContextMenu({ ...positionContextMenu(event) });
    }
  };

  const closeSelectionContextMenu = () => {
    setShowSelectionContextMenu(null);
  };

  const onSelectionChange = ({ nodes }) => {
    dispatch(builderSetSelectedNodes(nodes));
  };

  // ***********************************************************************************

  return (
    <Box
      sx={{ width: '100%', height: '100%' }}
      onContextMenu={handleSelectionContextMenu}
      onClick={closeSelectionContextMenu}
    >
      <ReactFlow
        ref={ref}
        className={styles.Canvas}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={nodes}
        edges={edges}
        onInit={setReactFlowInstance}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onNodesDelete={onNodesDelete}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        proOptions={proOptions}
        snapToGrid={snapToGrid}
      >
        <MiniMap pannable zoomable />
        <Controls showInteractive={interactive} />
        <Background />
        <Panel position="top-right">
          <Button
            id="buttonReactflowArrange"
            onClick={() => onLayout(layout)}
            variant="contained"
            size="small"
          >
            Arrange
          </Button>
        </Panel>
        <Panel position="bottom-center">
          <Typography variant="caption" color="textSecondary">
            Shift-click to select multiple elements
          </Typography>
        </Panel>
        {
          /* Node context menu */
          showNodeContextMenu && <NodeContextMenu onClick={onPaneClick} {...showNodeContextMenu} />
        }
        {
          /* Selection context menu */
          showSelectionContextMenu && (
            <SelectionContextMenu onClick={onPaneClick} {...showSelectionContextMenu} />
          )
        }
        {
          /* Group context menu */
          showGroupContextMenu && (
            <GroupContextMenu onClick={onPaneClick} {...showGroupContextMenu} />
          )
        }
      </ReactFlow>
    </Box>
  );
};

export default Flow;
