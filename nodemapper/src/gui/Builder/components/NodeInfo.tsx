import React from "react";
import styled from "@emotion/styled";

import { useState } from "react";
import { useEffect } from "react";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";

import "./HighlightedJSON.css";

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  height: 100%;
`;

/*
 * HighlightedJSON code modified from:
 * https://codepen.io/benshope/pen/BxVpjo
 */
const HighlightedJSON = (json_obj) => {
  const json = json_obj.json;
  if (json === "" || json === undefined || json === JSON.stringify({})) {
    return <div className="json"></div>;
  }
  if (json === JSON.stringify({})) {
    return <div className="json"></div>;
  }
  console.log(json);
  console.log(JSON.parse(json));
  const highlightedJSON = (jsonObj) =>
    Object.keys(jsonObj).map((key) => {
      const value = jsonObj[key];
      let valueType = typeof value;
      const isSimpleValue =
        ["string", "number", "boolean"].includes(valueType) || !value;
      if (isSimpleValue && valueType === "object") {
        valueType = "null" as undefined;
      }
      return (
        <div key={key} className="line">
          <span className="key">{key}:</span>
          {isSimpleValue ? (
            valueType === "string" ? (
              <span className={valueType}>&quot;{`${value}`}&quot;</span>
            ) : (
              <span className={valueType}>{`${value}`}</span>
            )
          ) : (
            highlightedJSON(value)
          )}
        </div>
      );
    });
  return <div className="json">{highlightedJSON(JSON.parse(json))}</div>;
};

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
        <HighlightedJSON json={codesnippet} />
      </Content>
    </>
  );
  /*return (
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
  );*/
}
