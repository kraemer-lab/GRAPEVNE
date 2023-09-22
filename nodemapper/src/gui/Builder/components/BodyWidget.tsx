import React from "react";
import styled from "@emotion/styled";

import { DiagramEngine } from "@projectstorm/react-diagrams";

import RepoBrowser from "./RepoBrowser";
import Canvas from "./Canvas";
import ConfigPane from "./ConfigPane";

import ResizeHandle from "./ResizeHandle";
import { Panel } from "react-resizable-panels";
import { PanelGroup } from "react-resizable-panels";
import styles from "./styles.module.css";

import { useAppSelector } from "redux/store/hooks";
import { ConfigPaneDisplay } from "redux/types";

interface BodyWidgetProps {
  engine: DiagramEngine;
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

export const BodyWidget = (props: BodyWidgetProps) => {
  const configPaneOpen = useAppSelector(
    (state) => state.builder.config_pane_display
  );

  return (
    <div className={styles.Container}>
      <Body>
        <Content>
          <PanelGroup direction="horizontal">
            <Panel className={styles.Panel} order={1} defaultSize={20}>
              <div
                className={styles.PanelContent}
                style={{
                  overflowY: "auto",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignSelf: "flex-start",
                }}
              >
                <RepoBrowser />
              </div>
            </Panel>
            <ResizeHandle />

            <Panel
              className={styles.Panel}
              order={2}
              defaultSize={configPaneOpen === ConfigPaneDisplay.None ? 80 : 60}
            >
              <div className={styles.BottomRow}>
                <Canvas engine={props.engine} />
              </div>
            </Panel>

            {configPaneOpen !== ConfigPaneDisplay.None ? (
              <>
                <ResizeHandle />
                <Panel
                  className={styles.Panel}
                  order={3}
                  defaultSize={20}
                  collapsible={true}
                >
                  <div className={styles.PanelContent}>
                    <ConfigPane />
                  </div>
                </Panel>
              </>
            ) : (
              <></>
            )}
          </PanelGroup>
        </Content>
      </Body>
    </div>
  );
};
