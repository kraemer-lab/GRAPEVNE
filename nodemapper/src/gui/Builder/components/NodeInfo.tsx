import styled from '@emotion/styled';
import React from 'react';
import HighlightedJSON from './HighlightedJSON';
import ResizeHandle from './ResizeHandle';
import styles from './styles.module.css';

import { useEffect, useState } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import './HighlightedJSON.css';

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
        borderStyle: 'solid',
        borderWidth: '1px 0px 0px 0px',
        flex: '0 0 auto',
        flexGrow: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'top',
        whiteSpace: 'pre-wrap', // preserves newlines in docstring
        color: '#cccccc',
        borderColor: '#ffffff',
      }}
    >
      <p>{props.docstring}</p>
    </div>
  );
};

const NodeInfo = () => {
  const [nodeparams, setNodeparams] = useState('');
  const [docstring, setDocstring] = useState('');
  const nodeinfo = useAppSelector((state) => state.builder.nodeinfo);
  const dispatch = useAppDispatch();

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
    <>
      <Content>
        <PanelGroup direction="vertical">
          {docstring === undefined || docstring === null || docstring === '' ? null : (
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
              <ResizeHandle orientation="vertical" />
            </>
          )}
          <Panel
            className={styles.Panel}
            order={1}
            style={{
              overflowY: 'auto',
            }}
          >
            <HighlightedJSON nodeid={JSON.parse(nodeinfo).id} json={nodeparams} />
          </Panel>
        </PanelGroup>
      </Content>
    </>
  );
};

export default NodeInfo;
