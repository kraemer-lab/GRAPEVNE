import Box from '@mui/material/Box';
import React from 'react';
import EasyEdit from 'react-easy-edit';
import BuilderEngine from '../BuilderEngine';
import NodeInfo from './NodeInfo';

import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Types } from 'react-easy-edit';
import {
  builderCheckNodeDependencies,
  builderNodeDeselected,
  builderSetEdges,
  builderSetNodes,
  builderUpdateNodeInfoName,
} from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import Button from '@mui/material/Button';
import { Edge, Node } from 'reactflow';

interface IPayload {
  id: string;
}

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
    const [nodes0, edges0] = app.ExpandNodeByName(
      props.nodeinfo.name as string,
      nodes, edges);
    console.log('newnodes', newnodes);
    if (nodes0 !== null && nodes0 !== undefined)
      setNewNodes({ nodes: nodes0, edges: edges0 });
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

const NodeInfoRenderer = (props) => {
  const dispatch = useAppDispatch();
  const nodeinfoStr = useAppSelector((state) => state.builder.nodeinfo);
  const nodes = useAppSelector((state) => state.builder.nodes);

  const SetNodeName = (name: string) => {
    if (name) dispatch(builderUpdateNodeInfoName(name));
  };

  if (!nodeinfoStr) return null;
  const nodeinfo = JSON.parse(nodeinfoStr);
  if (Object.keys(nodeinfo).length === 0) return null;

  // Get node to lock/unlock it during text edits
  const app = BuilderEngine.Instance;
  const node = app.getNodeByName(nodeinfo.name as string, nodes);

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
          borderStyle: 'solid',
          borderWidth: '0px 0px 1px 0px',
          flex: '0 0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            fontWeight: 'bold',
          }}
        >
          <EasyEdit
            type={Types.TEXT}
            onHoverCssClass="easyedit-hover"
            value={nodeinfo.name}
            saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
            cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
            onSave={(value) => {
              SetNodeName(value);
            }}
            saveOnBlur={true}
          />
        </Box>
        <Box>
          <ValidateButton nodename={nodeinfo.name} />
          {PermitNodeExpand(nodeinfo, nodes) && <ExpandButton nodeinfo={nodeinfo} />}
        </Box>
      </Box>
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
