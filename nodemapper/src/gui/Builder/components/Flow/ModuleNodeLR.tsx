import Box from '@mui/material/Box';
import React from 'react';

import { faLeftRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NodeData } from 'NodeMap/scene/Flow'; // Custom Node definition
import { Handle, NodeProps, NodeResizeControl, Position, ResizeControlVariant } from 'reactflow';
import { useAppSelector } from 'redux/store/hooks';

import 'reactflow/dist/style.css';
import './flow.css';
import * as styles from './flow.module.css';

const nodeResizeControlStyle = {
  background: 'transparent',
  border: 'none',
  width: '98%',
  color: 'white',
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

export default ModuleNodeLR;
