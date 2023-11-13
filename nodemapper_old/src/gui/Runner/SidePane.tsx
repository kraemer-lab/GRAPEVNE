import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { ReactSlidingPane } from "react-sliding-pane";
import SidePaneContent from "./SidePaneContent";
import { useAppSelector, useAppDispatch } from "redux/store/hooks";

import "./SidePane.css";

const SidePane = () => {
  const nodeinfo = useAppSelector((state) => state.display.nodeinfo);

  let title = "Info pane";
  if (nodeinfo !== "") {
    const json = JSON.parse(nodeinfo);
    title = json.name;
  }

  const dispatch = useAppDispatch();
  return (
    <>
      <div className="sidepane">
        <div className="title">{title}</div>
        <SidePaneContent />
      </div>
    </>
  );
};

export default SidePane;
