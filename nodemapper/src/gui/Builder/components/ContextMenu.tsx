import React from 'react';
import { useDispatch } from 'react-redux';
import { builderBuildAndRunToModule } from 'redux/actions';
import { builderBuildAndForceRunToModule } from 'redux/actions';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import BuilderEngine from './BuilderEngine';

import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { useAppSelector } from 'redux/store/hooks';
import { getNodeById } from './Flow';

interface ContextMenuProps {
  id: string;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const ContextMenu = ({ id, top, left, right, bottom, ...props }: ContextMenuProps) => {
  const { getNode, setNodes, addNodes, setEdges } = useReactFlow();
  const dispatch = useDispatch();
  const nodes = useAppSelector((state) => state.builder.nodes);
  const node_name = getNodeById(id, nodes).data.config.name;

  const duplicateNode = useCallback(() => {
    const app = BuilderEngine.Instance;
    const node = JSON.parse(JSON.stringify(getNode(id)));
    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };
    const name = app.EnsureUniqueName(node_name, nodes);
    const newid = app.getUniqueNodeID(nodes);
    node.data.config.name = name;
    addNodes({ ...node, id: newid, position });
  }, [id, getNode, addNodes]);

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id));
  }, [id, setNodes, setEdges]);

  const runToModule = () => {
    dispatch(builderBuildAndRunToModule(node_name));
  }
  
  const forceRunToModule = () => {
    dispatch(builderBuildAndForceRunToModule(node_name));
  }

  return (
    <Box style={{ top, left, right, bottom }} className="context-menu" {...props}>
      <Box style={{ margin: '0.5em' }}>
        <Typography>{node_name}</Typography>
      </Box>
      <Button onClick={runToModule}>run to module</Button>
      <Button onClick={forceRunToModule}>run to module (force)</Button>
      <Button onClick={duplicateNode}>duplicate</Button>
      <Button onClick={deleteNode}>delete</Button>
    </Box>
  );
}

export default ContextMenu;
