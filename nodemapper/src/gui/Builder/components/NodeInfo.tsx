import React from 'react'
import { useState, useEffect } from 'react'
import { useAppSelector } from 'redux/store/hooks'
import { useAppDispatch } from 'redux/store/hooks'
import styled from '@emotion/styled';

export const Content = styled.div`
  display: flex;
  flex-grow: 1;
  margin-top: 20px;
  background: #DDDDDD;
  height: 100px;
  position: fixed;
  bottom: 0px;
  width: 100%;
`;

export default function NodeInfo() {
  const nodeinfo = useAppSelector(state => state.display.nodeinfo);
  const dispatch = useAppDispatch();

  const [codesnippet, setCodesnippet] = useState("")

  useEffect(() => {
    if (nodeinfo === "") {
      setCodesnippet("")
    } else {
      const json = JSON.parse(nodeinfo)
      setCodesnippet(json.code)
    }
  }, [nodeinfo])

  return (
    <>
      <Content>
      <textarea
        id="codesnippet" {...{rows: 15}}
        style={{width: "100%"}}
        value={codesnippet}
        onChange={()=>{}}  // eslint-disable-line @typescript-eslint/no-empty-function
      />
      </Content>
    </>
  );
}
