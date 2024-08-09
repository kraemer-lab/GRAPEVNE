import { Box } from '@mui/material';
import { FitAddon } from '@xterm/addon-fit';
import React from 'react';
import { Terminal } from 'xterm';
import InfoPanel from './InfoPanel';
import ResizeHandle from './ResizeHandle';

import { Panel, PanelGroup } from 'react-resizable-panels';
import Flow from './Flow';

const terminalAPI = window.terminalAPI;

/**
 * Canvas display area for the Builder application.
 *
 * This is the main display area for the Builder application. It contains
 * the workflow graph and the configuration pane.
 *
 * Elements:
 * 1. Canvas (contains the workflow graph)
 * 2. Panel group (tabbed panel group for e.g. log display)
 */
const Canvas = () => {
  // Pass Terminal and fitAddon to InfoPanel
  let terminal: Terminal;
  let fitAddon: FitAddon;
  if (terminalAPI !== undefined) {
    terminal = new Terminal();
    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    fitAddon.fit();
  }

  return (
    <PanelGroup direction="vertical">
      <Panel defaultSize={70}>
        <Flow />
      </Panel>
      <ResizeHandle orientation="horizontal" />
      <Panel
        defaultSize={30}
        collapsible={true}
        onResize={() => {
          if (fitAddon !== undefined) {
            fitAddon.fit();
          }
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <InfoPanel terminal={terminal} fitAddon={fitAddon} />
        </Box>
      </Panel>
    </PanelGroup>
  );
};

export default Canvas;
