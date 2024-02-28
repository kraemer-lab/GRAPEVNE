import { Box } from '@mui/material';
import TerminalController from 'Terminal/TerminalController';
import React from 'react';
import InfoPanel from './InfoPanel';
import ResizeHandle from './ResizeHandle';

import { Panel, PanelGroup } from 'react-resizable-panels';
import Flow from './Flow';

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
const Canvas = () => (
  <PanelGroup direction="vertical">
    <Panel defaultSize={70}>
      <Flow />
    </Panel>
    <ResizeHandle orientation="horizontal" />
    <Panel
      defaultSize={30}
      collapsible={true}
      onResize={() => {
        const term = TerminalController.Instance; // singleton instance
        term.fitAddon.fit();
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
        <InfoPanel />
      </Box>
    </Panel>
  </PanelGroup>
);

export default Canvas;
