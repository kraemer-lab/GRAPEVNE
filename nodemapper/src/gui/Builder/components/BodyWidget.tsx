import React from 'react';

import Canvas from './Canvas';
import NodeInfoRenderer from './NodeInfoRenderer';
import RepoBrowser from './RepoBrowser';

import { Panel, PanelGroup } from 'react-resizable-panels';
import ResizeHandle from './ResizeHandle';
import styles from './styles.module.css';

import { Box } from '@mui/material';
import { useAppSelector } from 'redux/store/hooks';
import { ConfigPaneDisplay } from 'redux/types';

/**
 * Main display body for the Builder application.
 *
 * Divides the main display into three sections:
 * 1. Left (repository browser)
 * 2. Central (workflow graph)
 * 3. Right (configuration pane)
 */
export const BodyWidget = () => {
  const configPaneOpen = useAppSelector((state) => state.builder.config_pane_display);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelGroup direction="horizontal">
        <Panel className={styles.Panel} order={1} defaultSize={20} collapsible={true}>
          <Box
            sx={{
              overflowY: 'auto',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignSelf: 'flex-start',
              width: '100%',
            }}
          >
            <RepoBrowser />
          </Box>
        </Panel>
        <ResizeHandle orientation="vertical" />

        <Panel order={2} defaultSize={configPaneOpen === ConfigPaneDisplay.None ? 80 : 50}>
          <Canvas />
        </Panel>

        {configPaneOpen !== ConfigPaneDisplay.None && (
          <>
            <ResizeHandle orientation="vertical" />
            <Panel order={3} defaultSize={30} collapsible={true}>
              <NodeInfoRenderer />
            </Panel>
          </>
        )}
      </PanelGroup>
    </Box>
  );
};
