import styled from '@emotion/styled';
import TerminalController from 'Terminal/TerminalController';
import React from 'react';
import InfoPanel from './InfoPanel';
import ResizeHandle from './ResizeHandle';

import { Panel, PanelGroup } from 'react-resizable-panels';
import { useAppSelector } from 'redux/store/hooks';
import Flow from './Flow';

import styles from './styles.module.css';

const builderAPI = window.builderAPI;
type Query = Record<string, unknown>;

interface IPayload {
  id: string;
}

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
  const configPaneOpen = useAppSelector((state) => state.builder.config_pane_display);

  return (
    <Body>
      <Content>
        <Layer>
          <PanelGroup direction="vertical">
            <Panel className={styles.Panel} defaultSize={70}>
              <Flow />
            </Panel>
            <ResizeHandle orientation="horizontal" />
            <Panel
              className={styles.Panel}
              defaultSize={30}
              collapsible={true}
              onResize={(size: number, _delta: number) => {
                const term = TerminalController.Instance; // singleton instance
                term.fitAddon.fit();
              }}
            >
              <div className={styles.PanelContent}>
                <InfoPanel />
              </div>
            </Panel>
          </PanelGroup>
        </Layer>
      </Content>
    </Body>
  );
};

export default Canvas;
