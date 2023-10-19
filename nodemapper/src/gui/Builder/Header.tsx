import React from "react";
import BuilderEngine from "./BuilderEngine";

import { useState } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";

import { displayUpdateNodeInfo } from "redux/actions";

import { builderLoadNodemap } from "redux/actions";
import { builderSaveNodemap } from "redux/actions";
import { builderImportModule } from "redux/actions";
import { builderBuildAndRun } from "redux/actions";
import { builderOpenTerminal } from "redux/actions";
import { builderBuildAsModule } from "redux/actions";
import { builderBuildAsWorkflow } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";
import { builderCleanBuildFolder } from "redux/actions";
import { builderGetRemoteModules } from "redux/actions";
import { builderToggleTerminalVisibility } from "redux/actions";
import { builderToggleSettingsVisibility } from "redux/actions";

const Header = () => {
  const dispatch = useAppDispatch();

  /*
  // Load nodemap from file
  const btnLoadScene = () => {
    BuilderEngine.Instance.LoadScene();
  };

  // Save nodemap to file
  const btnSaveScene = () => {
    BuilderEngine.Instance.SaveScene();
  };
  */

  // Load nodemap from file
  const btnClearScene = () => {
    BuilderEngine.Instance.ClearScene();
    //dispatch(displayUpdateNodeInfo(""));
    dispatch(builderNodeDeselected(""));
  };

  // Run - build and run the workflow
  const btnRun = () => {
    dispatch(builderBuildAndRun());
  };

  // Clean build folder
  const btnCleanBuildFolder = () => {
    dispatch(builderCleanBuildFolder());
  };

  // Build as module
  const btnBuildAsModule = () => {
    dispatch(builderBuildAsModule());
  };
  
  // Build as workflow
  const btnBuildAsWorkflow = () => {
    dispatch(builderBuildAsWorkflow());
  };

  // Distribute model (visual)
  const btnArrange = () => {
    BuilderEngine.Instance.RedistributeModel();
  };

  // Load modules from repository
  const btnGetModuleList = () => {
    dispatch(builderGetRemoteModules());
  };

  // Open settings pane
  const btnSettings = () => {
    dispatch(builderToggleSettingsVisibility());
  };

  return (
    <>
      <link
        href="http://fonts.googleapis.com/css?family=Oswald"
        rel="stylesheet"
        type="text/css"
      />
      <div
        style={{
          display: "flex",
          fontSize: 18,
          marginLeft: 0,
          marginBottom: 2,
          alignItems: "center",
        }}
      >
        {/*
          *** LOAD function needs to assign eventListeners on load
        <button
          id="btnBuilderLoadScene"
          className="btn"
          onClick={btnLoadScene}
        >
          LOAD
        </button>

        <button
          id="btnBuilderSaveScene"
          className="btn"
          onClick={btnSaveScene}
        >
          SAVE
        </button>
        */}
        GRAPEVNE
        <button id="btnBuilderBuildAndTest" className="btn" onClick={btnRun}>
          TEST BUILD
        </button>
        <button
          id="btnBuilderCleanBuildFolder"
          className="btn"
          onClick={btnCleanBuildFolder}
        >
          DELETE TEST BUILD
        </button>
        <button
          id="btnBuilderBuildAsModule"
          className="btn"
          onClick={btnBuildAsModule}
        >
          BUILD AS MODULE
        </button>
        <button
          id="btnBuilderBuildAsWorkflow"
          className="btn"
          onClick={btnBuildAsWorkflow}
        >
          BUILD AS WORKFLOW
        </button>
        |
        <button
          id="btnBuilderClearScene"
          className="btn"
          onClick={btnClearScene}
        >
          CLEAR GRAPH
        </button>
        <button
          id="btnBuilderArrangeGraph"
          className="btn"
          onClick={btnArrange}
        >
          ARRANGE GRAPH
        </button>
        |
        <button
          id="btnBuilderGetModuleList"
          className="btn"
          onClick={btnGetModuleList}
        >
          GET MODULE LIST
        </button>
        <button id="btnBuilderSettings" className="btn" onClick={btnSettings}>
          SETTINGS
        </button>
      </div>
    </>
  );
};

export default Header;
