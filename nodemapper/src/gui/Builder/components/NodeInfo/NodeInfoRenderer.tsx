import Box from '@mui/material/Box';
import React from 'react';
import BuilderEngine from '../BuilderEngine';
import NodeInfo from './NodeInfo';

import {
  builderCheckNodeDependencies,
  builderNodeDeselected,
  builderSetEdges,
  builderSetNodes,
  builderUpdateNodeInfoName,
} from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import { useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import { Edge, Node } from 'reactflow';

interface ExpandProps {
  nodeinfo: Record<string, unknown>;
}

interface ValidateButtonProps {
  nodename: string;
}

const ValidateButton = (props: ValidateButtonProps) => {
  const dispatch = useAppDispatch();

  const btnValidate = () => {
    dispatch(builderCheckNodeDependencies(props.nodename));
  };

  return (
    <Button
      id="btnBuilderValidate"
      className="btn"
      onClick={btnValidate}
      variant="contained"
      size="small"
    >
      Validate
    </Button>
  );
};

const ExpandButton = (props: ExpandProps) => {
  const [newnodes, setNewNodes] = React.useState({
    nodes: [] as Node[],
    edges: [] as Edge[],
  });
  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => state.builder.nodes);
  const edges = useAppSelector((state) => state.builder.edges);

  const showExpand = useAppSelector((state) => state.builder.can_selected_expand);

  const btnExpand = () => {
    // Expand the selected node into it's constituent modules
    const app = BuilderEngine.Instance;
    const [nodes0, edges0] = app.ExpandNodeByName(props.nodeinfo.name as string, nodes, edges);
    console.log('newnodes', newnodes);
    if (nodes0 !== null && nodes0 !== undefined) setNewNodes({ nodes: nodes0, edges: edges0 });
  };

  React.useEffect(() => {
    if (newnodes.nodes.length > 0) {
      // Ensure the expanded node is deselected (and no longer editable)
      dispatch(builderSetNodes(newnodes.nodes));
      dispatch(builderSetEdges(newnodes.edges));
      dispatch(builderNodeDeselected());
    }
  }, [newnodes]);

  if (showExpand) {
    return (
      <Button
        id="btnBuilderExpand"
        className="btn"
        onClick={btnExpand}
        variant="contained"
        size="small"
      >
        Expand
      </Button>
    );
  } else {
    return null;
  }
};

const PermitNodeExpand = (nodeinfo: Record<string, unknown>, nodes) => {
  const app = BuilderEngine.Instance;
  return app.CanNodeExpand(nodeinfo.name as string, nodes);
};

const NodeInfoRenderer = () => {
  const dispatch = useAppDispatch();
  const nodeinfoStr = useAppSelector((state) => state.builder.nodeinfo);
  const nodes = useAppSelector((state) => state.builder.nodes);

  if (!nodeinfoStr) return null;
  const nodeinfo = JSON.parse(nodeinfoStr);
  if (Object.keys(nodeinfo).length === 0) return null;

  const SetNodeName = (name: string) => {
    if (name && name !== nodeinfo.name) dispatch(builderUpdateNodeInfoName(name));
  };

  // Get theme
  const theme = useTheme();

  return (
    <Box
      key={'nodeinfo-' + nodeinfo.id} // ensures render defaults are reset when node is changed
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexFlow: 'column',
      }}
    >
      <Box
        sx={{
          flex: '0 0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextField
          fullWidth
          variant="standard"
          size="small"
          sx={{
            mt: 0.5,
            ml: 0.75,
            input: {
              fontWeight: 'bold',
              color: theme.palette.primary.main,
            },
          }}
          InputProps={{
            disableUnderline: true,
          }}
          value={nodeinfo.name}
          onChange={(elem) => {
            SetNodeName(elem.target.value);
          }}
        />
        <Box display="flex" flexDirection="row">
          <ValidateButton nodename={nodeinfo.name} />
          {PermitNodeExpand(nodeinfo, nodes) && <ExpandButton nodeinfo={nodeinfo} />}
        </Box>
      </Box>
      <Divider />
      <Box
        sx={{
          flex: '1 1 auto',
          overflowY: 'auto',
        }}
      >
        <NodeInfo />
      </Box>
    </Box>
  );
};

export default NodeInfoRenderer;
