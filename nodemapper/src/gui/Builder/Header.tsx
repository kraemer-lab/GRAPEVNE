import React from "react";
import BuilderEngine from "./BuilderEngine";

import { useState } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";

import { displayUpdateNodeInfo } from "redux/actions";

import { builderLoadNodemap } from "redux/actions";
import { builderSaveNodemap } from "redux/actions";
import { builderImportModule } from "redux/actions";
import { builderCompileToJson } from "redux/actions";
import { builderGetRemoteModules } from "redux/actions";
import { builderSetRepositoryTarget } from "redux/actions";

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

  // Load modules from repository
  const btnGetModuleList = () => {
    dispatch(builderGetRemoteModules());
  };

  const btnImportModule = () => {
    //dispatch(builderImportModule());
    console.error("Import of individual modules not currently implemented.");
  };

  const selectRepositoryTarget = (target) => {
    let repo = {};
    switch (target) {
      case "LocalFilesystem":
        repo = {
          type: "local",
          listing_type: "DirectoryListing",
          repo: "../../snakeshack",
        };
        break;
      case "DirectoryListing":
        repo = {
          type: "github",
          listing_type: "DirectoryListing",
          repo: "jsbrittain/snakeshack",
        };
        break;
      case "BranchListing":
        repo = {
          type: "github",
          listing_type: "BranchListing",
          repo: "jsbrittain/snakeshack",
        };
        break;
      default:
        console.error("Unknown repository type selected: ", target);
    }
    dispatch(builderSetRepositoryTarget(repo));
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
          fontSize: 18,
          marginLeft: 0,
          marginBottom: 2,
        }}
      >
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
        {/*
          <button className="btn" onClick={btnImportModule}>
            IMPORT MODULE
          </button>
        */}
        <button className="btn" onClick={btnGetModuleList}>
          GET MODULE LIST
        </button>
        <select
          defaultValue="localFilesystem"
          onChange={(e) => selectRepositoryTarget(e.target.value)}
        >
          <option value="LocalFilesystem">Local filesystem</option>
          <option value="DirectoryListing">Directory Listing (Github)</option>
          <option value="BranchListing">Branch Listing (Github)</option>
        </select>
        <StatusBar />
      </div>
    </>
  );
}

export default Header;
