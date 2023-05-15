import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { ReactSlidingPane } from "react-sliding-pane";
import { displayCloseSettings } from "redux/actions";
import SidePaneContent from "./SidePaneContent";
import { useAppSelector, useAppDispatch } from "redux/store/hooks";

import "./SidePane.css";

function SidePane() {
  const showpane = useAppSelector((state) => state.display.show_settings_panel);
  const nodeinfo = useAppSelector((state) => state.display.nodeinfo);
  const [title, setTitle] = useState("Info pane");
  const [blocktype, setBlocktype] = useState("");

  useEffect(() => {
    if (nodeinfo === "") {
      setTitle("Info pane");
      setBlocktype("");
    } else {
      const json = JSON.parse(nodeinfo);
      setTitle(json.name);
      setBlocktype(json.type);
    }
  }, [nodeinfo]);

  const dispatch = useAppDispatch();
  return (
    <>
      <div className="sidepane">
        <div className="title">{title}</div>
        {/*<div className="subtitle">{blocktype}</div>
      <br />*/}
        <SidePaneContent />
      </div>
    </>
  );
}

export default SidePane;
