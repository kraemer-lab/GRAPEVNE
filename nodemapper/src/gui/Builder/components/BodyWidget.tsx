import styled from '@emotion/styled';
import React from 'react';

import Canvas from './Canvas';
import NodeInfoRenderer from './NodeInfoRenderer';
import RepoBrowser from './RepoBrowser';

import { Panel, PanelGroup } from 'react-resizable-panels';
import ResizeHandle from './ResizeHandle';
import styles from './styles.module.css';

import { useAppSelector } from 'redux/store/hooks';
import { ConfigPaneDisplay } from 'redux/types';
import { Box } from '@mui/material';

const Body = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  height: 100%;
  overflow: clip;
`;

const Layer = styled.div`
  position: relative;
  flex-direction: vertical;
  flex-grow: 1;
`;

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
    <Box className={styles.Container}>
      <Body>
        <Content>
          <PanelGroup direction="horizontal">
            <Panel className={styles.Panel} order={1} defaultSize={20}>
              <Box
                className={styles.PanelContent}
                sx={{
                  overflowY: 'auto',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignSelf: 'flex-start',
                }}
              >
                <RepoBrowser />
              </Box>
            </Panel>
            <ResizeHandle orientation='vertical' />

            <Panel
              className={styles.Panel}
              order={2}
              defaultSize={configPaneOpen === ConfigPaneDisplay.None ? 80 : 50}
            >
              <Box className={styles.BottomRow}>
                <Canvas />
              </Box>
            </Panel>

            {configPaneOpen !== ConfigPaneDisplay.None && (
              <>
                <ResizeHandle orientation='vertical' />
                <Panel
                  className={styles.Panel}
                  order={3}
                  defaultSize={30}
                  collapsible={true}
                >
                  <Box className={styles.PanelContent}>
                    <NodeInfoRenderer />
                  </Box>
                </Panel>
              </>
            )}
          </PanelGroup>
        </Content>
      </Body>
    </Box>
  );
};
