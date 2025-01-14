import React from 'react';
import { useDispatch } from 'react-redux';
import { builderSetNodes } from 'redux/actions';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import BuilderEngine from './BuilderEngine';

import { Node } from 'NodeMap/scene/Flow'; // Custom Node definition
import { useAppSelector } from 'redux/store/hooks';

interface SelectionContextMenuProps {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const SelectionContextMenu = ({
  top,
  left,
  right,
  bottom,
  ...props
}: SelectionContextMenuProps) => {
  const dispatch = useDispatch();
  const nodes = useAppSelector((state) => state.builder.nodes);
  const selected_nodes = useAppSelector((state) => state.builder.selected_nodes);

  const calculateBoundingBox = (nodes: Node[]) => {
    const minX = Math.min(...nodes.map((node) => node.position.x));
    const minY = Math.min(...nodes.map((node) => node.position.y));
    const maxX = Math.max(...nodes.map((node) => node.position.x + node.width));
    const maxY = Math.max(...nodes.map((node) => node.position.y + node.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  const createGroup = () => {
    const app = BuilderEngine.Instance;
    const name = app.EnsureUniqueName('Group', nodes);
    const groupid = app.getUniqueNodeID(nodes);
    const { x, y, width, height } = calculateBoundingBox(selected_nodes);
    const { marginX, marginY } = { marginX: 10, marginY: 10 };
    const color = 'rgba(207, 182, 255, 0.4)';
    const group: Node = {
      id: groupid,
      type: 'group',
      position: {
        x: x - marginX,
        y: y - marginY,
      },
      style: {
        width: width + 2 * marginX,
        height: height + 2 * marginY,
        backgroundColor: color,
      },
      data: {
        color: color,
        config: {
          name: name,
          type: null,
          config: {
            snakefile: '',
            config: {
              ports: [],
              namespace: null,
            },
          },
        },
      },
    };

    // Parent selected nodes to group
    const selected_node_ids = selected_nodes.map((n) => n.id);
    let newnodes = nodes.map((node) => {
      // deep clone without write-constraints and make the object extensible
      const n = JSON.parse(JSON.stringify(node));
      if (selected_node_ids.includes(n.id)) {
        n.parentId = groupid; // assign node to subflow ('group')
        n.extent = 'parent'; // restrain node to group bounds
        // position becomes relative to subflow
        n.position.x -= group.position.x;
        n.position.y -= group.position.y;
        // remove selection property
        n.selected = false;
      }
      return n;
    });
    dispatch(builderSetNodes([group, ...newnodes])); // draw groups below selected nodes
  };

  return (
    <Box style={{ top, left, right, bottom }} className="context-menu" {...props}>
      <Box style={{ margin: '0.5em' }}>
        <Typography>Selection</Typography>
      </Box>
      <Button onClick={createGroup}>CREATE GROUP</Button>
    </Box>
  );
};

export default SelectionContextMenu;
