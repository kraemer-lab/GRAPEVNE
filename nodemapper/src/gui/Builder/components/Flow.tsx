import _ from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import BuilderEngine from './BuilderEngine';

import {
  builderAddNode,
  builderNodeDeselected,
  builderNodeSelected,
  builderSetConfigFiles,
  builderSetEdges,
  builderSetNodes,
  builderUpdateStatusText,
} from 'redux/actions';

import Box from '@mui/material/Box';
import { Edge, Node, NodeData } from 'NodeMap/scene/Flow'; // Custom Node definition

import { toPng, toSvg } from 'html-to-image';
import ReactFlow, {
  Background,
  BaseEdge,
  Connection,
  Controls,
  EdgeChange,
  EdgeLabelRenderer,
  EdgeProps,
  Handle,
  NodeChange,
  NodeProps,
  NodeResizeControl,
  Panel,
  Position,
  ResizeControlVariant,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getBezierPath,
  getNodesBounds,
  getSmoothStepPath,
  getStraightPath,
} from 'reactflow';

import { faLeftRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@mui/material/Button';
import Popper from '@mui/material/Popper';
import { Query } from 'api';
import 'reactflow/dist/style.css';
import ContextMenu from './ContextMenu';
import './flow.css';
import * as styles from './flow.module.css';

import dagre from 'dagre';

const nodeResizeControlStyle = {
  background: 'transparent',
  border: 'none',
  width: '98%',
  color: 'white',
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  // Typical node size for spacing
  const nodeWidth = 200;
  const nodeHeight = 50;

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

const builderAPI = window.builderAPI;

const proOptions = {
  hideAttribution: true,
};

export const wranglename = (name: string) => {
  return name.replace(/ /g, '_').replace(/\(/g, '_').replace(/\)/g, '_').toLowerCase();
};

const ModuleNode = (props: NodeProps<NodeData>) => {
  // Select the appropriate layout based on the current layout setting
  const layout = useAppSelector((state) => state.settings.layout_direction);
  if (layout === 'LR') return ModuleNodeLR(props);
  else return ModuleNodeTB(props);
};

const ModuleNodeLR = (props: NodeProps<NodeData>) => {
  // ModuleNode component (Left-to-Right layout)
  const nodeinfo = useAppSelector((state) => state.builder.nodeinfo);
  let selected = false;
  if (nodeinfo) {
    const nodeinfo_id = JSON.parse(nodeinfo)['id'];
    selected = nodeinfo_id === props.id;
  }

  // Extract input_namespace and wrap as list as necessary
  const node_config = props.data?.config?.config?.config ?? null;
  const ports = node_config.ports ?? [];

  return (
    <>
      <Box
        className={styles.Node}
        style={{
          backgroundColor: props.data.color,
        }}
      >
        {selected && (
          <NodeResizeControl
            style={nodeResizeControlStyle}
            minWidth={120}
            minHeight={50}
            variant={ResizeControlVariant.Line}
            position="top-right"
            shouldResize={(e, params) => params.direction[1] === 0}
          >
            <span
              style={{
                float: 'right',
                color: '#dedede',
              }}
            >
              <FontAwesomeIcon icon={faLeftRight} />
            </span>
          </NodeResizeControl>
        )}
        <Box className={styles.HeaderPanel}>
          <Box className={styles.HeaderText}>{props.data.config.name}</Box>
        </Box>
        <Box
          className={styles.BodyPanel}
          style={{
            height: `${ports.length * 18}px`,
          }}
        >
          {ports.map((port_element) => {
            // Format port name
            const ref = port_element['ref'];
            const label = port_element['label'];

            return (
              <Box key={'div-' + ref}>
                <Handle
                  className={styles.HandleInput}
                  id={ref}
                  key={ref}
                  type="target"
                  position={Position.Left}
                  style={{
                    top: `${ports.indexOf(port_element) * 18 + 38}px`,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    console.debug('Input handle clicked: ', event.target);
                  }}
                />
                <Box
                  className={styles.InputPortLabel}
                  style={{
                    pointerEvents: 'none', // pass-through click events
                    top: `${ports.indexOf(port_element) * 18 + 29}px`,
                  }}
                >
                  {label}
                </Box>
              </Box>
            );
          })}
          <Box>
            <Handle
              className={styles.HandleOutput}
              id="out"
              type="source"
              position={Position.Right}
              style={{
                top: '50%',
                height: '100%',
                width: '12px',
              }}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
};

const ModuleNodeTB = (props: NodeProps<NodeData>) => {
  // ModuleNode component (Top-to-Bottom layout)
  const nodeinfo = useAppSelector((state) => state.builder.nodeinfo);
  let selected = false;
  if (nodeinfo) {
    const nodeinfo_id = JSON.parse(nodeinfo)['id'];
    selected = nodeinfo_id === props.id;
  }

  // Extract input_namespace and wrap as list as necessary
  const node_config = props.data?.config?.config?.config ?? null;
  const ports = node_config.ports ?? [];

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [portLabel, setPortLabel] = React.useState('');

  return (
    <>
      <Box
        className={styles.Node}
        style={{
          backgroundColor: props.data.color,
          height: '46px',
        }}
      >
        {selected && (
          <NodeResizeControl
            style={nodeResizeControlStyle}
            minWidth={120}
            minHeight={50}
            variant={ResizeControlVariant.Line}
            position="top-right"
            shouldResize={(e, params) => params.direction[1] === 0}
          >
            <span
              style={{
                float: 'right',
                color: '#dedede',
              }}
            >
              <FontAwesomeIcon icon={faLeftRight} />
            </span>
          </NodeResizeControl>
        )}
        <Box className={styles.HeaderPanel}>
          <Box className={styles.HeaderText} sx={{ marginTop: '6px' }}>
            {props.data.config.name}
          </Box>
        </Box>
        <Box
          className={styles.BodyPanel}
          style={{
            height: '18px',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
          }}
        >
          {ports.map((port_element) => {
            // Format port name
            const ref = port_element['ref'];
            const label = port_element['label'];

            return (
              <>
                <Box
                  key={'div-' + ref}
                  style={{
                    width: '100%',
                  }}
                >
                  <Handle
                    className={styles.HandleInput}
                    id={ref}
                    key={ref}
                    type="target"
                    position={Position.Top}
                    style={{
                      position: 'relative',
                      top: '-39px',
                      left: '50%',
                      width: '100%',
                      height: '8px',
                      maxWidth: '40px',
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      console.debug('Input handle clicked: ', event.target);
                    }}
                    onMouseEnter={(event) => {
                      setAnchorEl(event.currentTarget);
                      setPortLabel(label);
                    }}
                    onMouseLeave={() => {
                      setAnchorEl(null);
                    }}
                  />
                </Box>
                <Popper id={'popup-' + ref} open={Boolean(anchorEl)} anchorEl={anchorEl}>
                  <Box sx={{ border: 1, p: 1, bgcolor: 'background.paper' }}>
                    {ports.map((p) => {
                      if (p['label'] === portLabel) {
                        return (
                          <Box key={p.ref} sx={{ fontWeight: 'bold' }}>
                            {p.label}
                          </Box>
                        );
                      }
                      return (
                        <Box key={p.ref} sx={{ color: 'grey' }}>
                          {p.label}
                        </Box>
                      );
                    })}
                  </Box>
                </Popper>
              </>
            );
          })}
        </Box>
        <Box>
          <Handle
            className={styles.HandleOutput}
            id="out"
            type="source"
            position={Position.Bottom}
            style={{
              top: `40px`,
              left: '50%',
              width: '100%',
              height: '8px',
            }}
          />
        </Box>
      </Box>
    </>
  );
};

const ExportCanvas = (nodes: Node[], exporterToImageFormat, fileExt) => {
  console.log('Exporting canvas as ' + fileExt);

  const downloadImage = (dataUrl) => {
    const a = document.createElement('a');
    a.setAttribute('download', 'workflow.' + fileExt);
    a.setAttribute('href', dataUrl);
    a.click();
  };

  const nodesBounds = getNodesBounds(nodes);
  exporterToImageFormat(document.querySelector('.react-flow__viewport') as HTMLElement, {
    backgroundColor: '#ffffff',
    width: nodesBounds.width + 100,
    height: nodesBounds.height + 100,
  }).then(downloadImage);
};

export const ExportAsPNG = (nodes: Node[]) => {
  ExportCanvas(nodes, toPng, 'png');
};

export const ExportAsSVG = (nodes: Node[]) => {
  ExportCanvas(nodes, toSvg, 'svg');
};

export const ButtonEdgeBezier = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <Box
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {/* Mid-path edge label*/}
        </Box>
      </EdgeLabelRenderer>
    </>
  );
};

export const ButtonEdgeSmoothStep = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <Box
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {/* Mid-path edge label*/}
        </Box>
      </EdgeLabelRenderer>
    </>
  );
};

export const ButtonEdgeStraight = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <Box
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {/* Mid-path edge label*/}
        </Box>
      </EdgeLabelRenderer>
    </>
  );
};

// Remember to useMemo if this is moved inside a component
const nodeTypes = {
  standard: ModuleNode,
};

const edgeTypes = {
  bezier: ButtonEdgeBezier,
  smoothstep: ButtonEdgeSmoothStep,
  straight: ButtonEdgeStraight,
};

export const getNodeById = (id: string, nodes: Node[]): Node | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
  }
  return null;
};

export const getNodeName = (node: Node): string => {
  return node.data.config.name;
};

export const getNodeByName = (name: string, nodes: Node[]): Node | null => {
  for (const node of nodes) {
    if (node.data.config.name === name) {
      return node;
    }
  }
  return null;
};

export const setNodeName = (nodes: Node[], id: string, name: string): Node[] =>
  nodes.map((node) => {
    if (node.id === id) {
      const newnode = JSON.parse(JSON.stringify(node));
      newnode.data.config.name = name;
      return newnode;
    } else {
      return node;
    }
  });

export const setNodeWorkflow = (
  nodes: Node[],
  id: string,
  workflow: Record<string, unknown>,
): Node[] => {
  return nodes.map((node) => {
    if (node.id === id) {
      const newnode = JSON.parse(JSON.stringify(node));
      newnode.data.config.config = workflow;
      return newnode;
    } else {
      return node;
    }
  });
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
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [menu, setMenu] = useState(null);
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

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setMenu(null); // Close context menu (if open)
    dispatch(builderNodeSelected(node));
  };

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    // Prevent native context menu from showing
    event.preventDefault();
    // Close module parameters pane (if open)
    dispatch(builderNodeDeselected());
    // Open context menu
    const pane = ref.current.getBoundingClientRect();
    // Position context menu; right-align if it is too close to the edge of the pane
    setMenu({
      id: node.id,
      top: event.clientY - pane.top < pane.height - 200 && event.clientY - pane.top,
      bottom:
        event.clientY - pane.top >= pane.height - 200 && pane.height - (event.clientY - pane.top),
      left: event.clientX - pane.left < pane.width - 200 && event.clientX - pane.left,
      right:
        event.clientX - pane.left >= pane.width - 200 && pane.width - (event.clientX - pane.left),
    });
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
    console.debug('Pane clicked');
    // Close context menu (if open)
    setMenu(null);
    // Close module parameters pane (if open)
    dispatch(builderNodeDeselected());
  }, [setMenu, dispatch]);

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
      const newnodes = getLayoutedElements(nodes, edges, direction);
      dispatch(builderSetNodes(newnodes));
    },
    [nodes, edges, dispatch],
  );

  return (
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
      proOptions={proOptions}
      snapToGrid={true}
    >
      <Controls />
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
      {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
    </ReactFlow>
  );
};

export { Edge, Node } from 'NodeMap/scene/Flow';
export default Flow;
