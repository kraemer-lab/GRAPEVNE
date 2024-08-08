import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';
import ResizeHandle from './../ResizeHandle';
import * as styles from './../styles.module.css';
import ConfigSelect from './ConfigSelect';
import HighlightedJSON from './HighlightedJSON';

import { useEffect, useState } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { useAppSelector } from 'redux/store/hooks';

interface DocStringProps {
  docstring: string;
}

const DocString = (props: DocStringProps) => {
  /*
   * Docstring rendering
   *
   * Apply custom styling to docstring
   */
  return (
    <Box
      className="docstring"
      sx={{
        flex: '0 0 auto',
        flexGrow: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'top',
        whiteSpace: 'pre-wrap', // preserves newlines in docstring
        borderColor: '#ffffff',
      }}
    >
      <Typography>{props.docstring}</Typography>
    </Box>
  );
};

const NodeInfo = () => {
  const [nodeparams, setNodeparams] = useState('');
  const [docstring, setDocstring] = useState('');
  const nodeinfo = useAppSelector((state) => state.builder.nodeinfo);

  useEffect(() => {
    if (nodeinfo === '') {
      setNodeparams('');
    } else {
      // Extricate docstring from codesnippet
      const nodeparamsObj = JSON.parse(JSON.parse(nodeinfo).nodeparams);
      setDocstring(nodeparamsObj.docstring);
      delete nodeparamsObj.docstring;
      setNodeparams(JSON.stringify(nodeparamsObj));
    }
  }, [nodeinfo]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        height: '100%',
        overflow: 'clip',
      }}
    >
      <PanelGroup direction="vertical">
        {docstring !== undefined && docstring !== null && docstring !== '' && (
          <>
            <Panel
              className={styles.Panel}
              order={0}
              defaultSize={40}
              collapsible={true}
              style={{
                overflowY: 'auto',
              }}
            >
              <DocString docstring={docstring} />
            </Panel>
            <ResizeHandle orientation="horizontal" />
          </>
        )}
        <Panel
          className={styles.Panel}
          order={1}
          style={{
            overflowY: 'auto',
          }}
        >
          <ConfigSelect />
          <HighlightedJSON nodeid={JSON.parse(nodeinfo).id} json={nodeparams} />
        </Panel>
      </PanelGroup>
    </Box>
  );
};

export default NodeInfo;
