import React from 'react';
import { useDispatch } from 'react-redux';
import { builderSetNodes } from 'redux/actions';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Node } from 'NodeMap/scene/Flow'; // Custom Node definition
import { useAppSelector } from 'redux/store/hooks';

interface GroupContextMenuProps {
  id: string;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const GroupContextMenu = ({ id, top, left, right, bottom, ...props }: GroupContextMenuProps) => {
  const dispatch = useDispatch();
  const nodes = useAppSelector((state) => state.builder.nodes);

  const deleteGroup = () => {
    console.log('Delete group ID: ', id);
    // First, identify group
    const group = nodes.find((node: Node) => node.id === id);
    // Orphan children from parent group
    let newnodes = nodes.map((node: Node) => {
      if (node.parentId === id) {
        const n = JSON.parse(JSON.stringify(node));
        n.parentId = undefined;
        n.extent = undefined;
        // Re-centre relative to panel
        n.position.x += group.position.x;
        n.position.y += group.position.y;
        return n;
      }
      return node;
    });
    // Finally, remove group
    newnodes = newnodes.filter((node: Node) => {
      if (node.id === id) {
        return false;
      }
      return true;
    });
    dispatch(builderSetNodes(newnodes));
  };

  return (
    <Box style={{ top, left, right, bottom }} className="context-menu" {...props}>
      <Box style={{ margin: '0.5em' }}>
        <Typography>Group</Typography>
      </Box>
      <Button onClick={deleteGroup}>DELETE GROUP</Button>
    </Box>
  );
};

export default GroupContextMenu;
