import React from "react";
import RunnerEngine from "./RunnerEngine";

import { useState } from "react";
import { useEffect } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";

import { displayZoomToFit } from "redux/actions";
import { displayDeleteResults } from "redux/actions";

import { runnerLoadSnakefile } from "redux/actions";
import { runnerImportSnakefile } from "redux/actions";
import { runnerLaunchSnakefile } from "redux/actions";
import { runnerUpdateStatusText } from "redux/actions";

import "./Header.css";

const StatusBar: React.FC = () => {
  const [status, setStatus] = useState("");
  const statustext = useAppSelector((state) => state.runner.statustext);
  React.useEffect(() => {
    setStatus(statustext);
  }, [statustext]);
  return (
    <div className="status-bar" style={{ fontSize: 14 }}>
      {status}
    </div>
  );
};

function Header() {
  const [textEditGraph, setTextEditGraph] = useState("EDIT GRAPH: OFF");
  const graph_is_moveable = useAppSelector(
    (state) => state.display.graph_is_moveable
  );
  const dispatch = useAppDispatch();

  // Load Scene
  const btnLoadScene = () => {
    RunnerEngine.Instance.LoadScene();
  };

  // Save Scene
  const btnSaveScene = () => {
    RunnerEngine.Instance.SaveScene();
  };

  // Check (import) Snakefile
  const btnCheckSnakefile = () => {
    dispatch(runnerImportSnakefile());
  };

  // Launch Snakefile
  const btnLaunchSnakefile = () => {
    dispatch(runnerLaunchSnakefile());
  };

  // Delete results
  const btnDeleteResults = () => {
    dispatch(displayDeleteResults());
  };

  // Distribute model (visual)
  const btnArrange = () => {
    RunnerEngine.Instance.RedistributeModel();
  };

  // Zoom to fit
  const btnZoomToFit = () => {
    dispatch(displayZoomToFit());
  };

  // render
  return (
    <>
      <link
        href="http://fonts.googleapis.com/css?family=Oswald"
        rel="stylesheet"
        type="text/css"
      />
      <div style={{ fontSize: 18, marginLeft: 0, marginBottom: 2 }}>
        <button className="btn" onClick={btnLoadScene}>
          LOAD
        </button>
        <button className="btn" onClick={btnSaveScene}>
          SAVE
        </button>
        <button className="btn" onClick={btnCheckSnakefile}>
          CHECK SNAKEFILE
        </button>
        <button className="btn" onClick={btnLaunchSnakefile}>
          RUN
        </button>
        <button className="btn" onClick={btnDeleteResults}>
          DELETE RESULTS
        </button>
        <button className="btn" onClick={btnArrange}>
          ARRANGE
        </button>
        <button className="btn" onClick={btnZoomToFit}>
          RESET VIEW
        </button>
        <StatusBar />
      </div>
    </>
  );
}

export default Header;
