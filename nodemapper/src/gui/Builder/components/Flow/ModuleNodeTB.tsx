import Box from '@mui/material/Box';
import Popper from '@mui/material/Popper';
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

export default ModuleNodeTB;
