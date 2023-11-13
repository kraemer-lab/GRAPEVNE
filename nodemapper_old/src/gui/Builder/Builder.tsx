import React from "react";
import axios from "axios";
import Header from "./Header";
import NodeManager from "./NodeManager";
import StatusBar from "./StatusBar";
import { useAppDispatch } from "redux/store/hooks";
import { getMasterRepoListURL } from "redux/globals";
import { builderLogEvent } from "redux/actions";
import { builderSetRepositoryTarget } from "redux/actions";

let master_repo_list_loaded = false;

const Builder = () => {
  // Load master repo list (once)
  const dispatch = useAppDispatch();
  const getMasterRepoList = async () => {
    const url = getMasterRepoListURL();
    return await axios
      .get(url)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        dispatch(builderLogEvent("Error loading master repository list"));
        dispatch(builderLogEvent(`  Error: ${error}`));
        dispatch(builderLogEvent(`  Loading URL: ${url}`));
      });
  };
  if (!master_repo_list_loaded) {
    getMasterRepoList();
    master_repo_list_loaded = true;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexFlow: "column",
        }}
      >
        <div style={{ flex: "0 1 auto" }}>
          <Header />
        </div>
        <div style={{ flex: "1 1 auto", overflowY: "auto" }}>
          <NodeManager />
        </div>
        <StatusBar />
      </div>
    </>
  );
};

export default Builder;
