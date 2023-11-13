import React from "react";
import { useState, useEffect } from "react";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";
import { displayUpdateNodeInfo } from "redux/actions/display";

import "./SidePaneContent.css";

const SidePaneContentComponent = () => {
  const nodeinfo = useAppSelector((state) => state.display.nodeinfo);

  let codesnippet = "";
  if (nodeinfo !== "") {
    const json = JSON.parse(nodeinfo);
    codesnippet = json.code;
  }

  return (
    <div>
      <textarea
        id="codesnippet"
        {...{ rows: 15 }}
        style={{
          width: "100%",
          color: "#cccccc",
          background: "#555555",
          borderColor: "#333333",
        }}
        value={codesnippet}
        readOnly
      />
    </div>
  );
};

export default SidePaneContentComponent;
