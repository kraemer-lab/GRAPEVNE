import React from "react";
import BuilderEngine from "./BuilderEngine";

import { useState } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";

import { displayUpdateNodeInfo } from "redux/actions";

import { builderLoadNodemap } from "redux/actions";
import { builderSaveNodemap } from "redux/actions";
import { builderCompileToJson } from "redux/actions";
import { builderGetRemoteModules } from "redux/actions";

const StatusBar: React.FC = () => {
  const [status, setStatus] = useState("");
  const statustext = useAppSelector((state) => state.builder.statustext);
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
  const dispatch = useAppDispatch();

  // Load nodemap from file
  const btnLoadScene = () => {
    BuilderEngine.Instance.LoadScene();
  };

  // Save nodemap to file
  const btnSaveScene = () => {
    BuilderEngine.Instance.SaveScene();
  };

  // Load nodemap from file
  const btnClearScene = () => {
    BuilderEngine.Instance.ClearScene();
    dispatch(displayUpdateNodeInfo(""));
  };

  // Build - compile config to workflow zip and download
  const btnBuild = () => {
    dispatch(builderCompileToJson());
  };

  // Distribute model (visual)
  const btnArrange = () => {
    BuilderEngine.Instance.RedistributeModel();
  };

  const btnGetModuleList = () => {
    dispatch(builderGetRemoteModules());
  };

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
        <button className="btn" onClick={btnBuild}>
          BUILD
        </button>
        <button className="btn" onClick={btnClearScene}>
          CLEAR
        </button>
        <button className="btn" onClick={btnArrange}>
          ARRANGE
        </button>
        <button className="btn" onClick={btnGetModuleList}>
          GET MODULE LIST
        </button>
        <StatusBar />
      </div>
    </>
  );
}

export default Header;
