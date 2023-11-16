import React from "react";
import styled from "@emotion/styled";
import HighlightedJSON from "./HighlightedJSON";
import ResizeHandle from "./ResizeHandle";
import styles from "./styles.module.css";

import { useState } from "react";
import { useEffect } from "react";
import { Component } from "react";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";
import { Panel } from "react-resizable-panels";
import { PanelGroup } from "react-resizable-panels";

import "./HighlightedJSON.css";

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  overflow: clip;
`;

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
    <div
      className="docstring"
      style={{
        borderStyle: "solid",
        borderWidth: "1px 0px 0px 0px",
        flex: "0 0 auto",
        flexGrow: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "top",
        whiteSpace: "pre-wrap", // preserves newlines in docstring
        color: "#cccccc",
        borderColor: "#ffffff",
      }}
    >
      <p>{props.docstring}</p>
    </div>
  );
};

const NodeInfo = () => {
  const [codesnippet, setCodesnippet] = useState("");
  const [docstring, setDocstring] = useState("");
  const nodeinfo = useAppSelector((state) => state.builder.nodeinfo);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (nodeinfo === "") {
      setCodesnippet("");
    } else {
      // Extricate docstring from codesnippet
      const code = JSON.parse(JSON.parse(nodeinfo).code);
      setDocstring(code.docstring);
      delete code.docstring;
      setCodesnippet(JSON.stringify(code));
    }
  }, [nodeinfo]);

  return (
    <>
      <Content>
        <PanelGroup direction="vertical">
          {docstring === undefined ||
          docstring === null ||
          docstring === "" ? null : (
            <>
              <Panel
                className={styles.Panel}
                order={0}
                defaultSize={40}
                collapsible={true}
                style={{
                  overflowY: "auto",
                }}
              >
                <DocString docstring={docstring} />
              </Panel>
              <ResizeHandle />
            </>
          )}
          <Panel
            className={styles.Panel}
            order={1}
            style={{
              overflowY: "auto",
            }}
          >
            <HighlightedJSON json={codesnippet} />
          </Panel>
        </PanelGroup>
      </Content>
    </>
  );
};

export default NodeInfo;
