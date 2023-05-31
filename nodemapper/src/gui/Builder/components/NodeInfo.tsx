import React from "react";
import styled from "@emotion/styled";
import HighlightedJSON from "./HighlightedJSON";

import { useState } from "react";
import { useEffect } from "react";
import { Component } from "react";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";

import "./HighlightedJSON.css";

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  height: 100%;
`;

export default function NodeInfo() {
  const [codesnippet, setCodesnippet] = useState("");
  const nodeinfo = useAppSelector((state) => state.display.nodeinfo);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (nodeinfo === "") {
      setCodesnippet("");
    } else {
      const json = JSON.parse(nodeinfo);
      setCodesnippet(json.code);
    }
  }, [nodeinfo]);

  return (
    <>
      <Content>
        <HighlightedJSON json={codesnippet} />
      </Content>
    </>
  );
}
