import React from "react";
import styled from "@emotion/styled";

import { useState } from "react";
import { useEffect } from "react";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  height: 100%;
`;

export default function NodeInfo() {
  const nodeinfo = useAppSelector((state) => state.display.nodeinfo);
  const dispatch = useAppDispatch();

  const [codesnippet, setCodesnippet] = useState("");

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
        <textarea
          id="codesnippet"
          style={{
            width: "100%",
            height: "100%",
            border: "0px",
            boxSizing: "border-box",
            outline: "none", // Remove highlight on focus
            resize: "none",
            color: "#dddddd",
            backgroundColor: "#333333",
          }}
          value={codesnippet}
          onChange={() => {}} // eslint-disable-line @typescript-eslint/no-empty-function
        />
      </Content>
    </>
  );
}
