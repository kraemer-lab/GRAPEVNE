import { createReducer } from "@reduxjs/toolkit";
import * as actions from "../actions";

interface IBuilderState {
  query: Record<string, string>;
  repo: Record<string, string>;
  modules_list: string;
  statustext: string;
  nodeinfo: string;
}

// State
const builderStateInit: IBuilderState = {
  query: {},
  repo: {
    // (TODO: replace with proper settings menu)
    type: "local",
    listing_type: "DirectoryListing",
    repo: "../../snakeshack",
    //type: "github",
    //listing_type: "DirectoryListing", //'BranchListing',
    //repo: "jsbrittain/snakeshack",
  },
  modules_list: "[]",
  statustext: "",
  nodeinfo: "",
};

// Nodemap
const builderReducer = createReducer(builderStateInit, (builder) => {
  builder
    .addCase(actions.builderLoadNodemap, (state, action) => {
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSaveNodemap, (state, action) => {
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderCompileToJson, (state, action) => {
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderRedraw, (state, action) => {
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSubmitQuery, (state, action) => {
      state.query = action.payload as Record<string, string>;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderAddLink, (state, action) => {
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderNodeSelected, (state, action) => {
      // Action intercepted in middleware to control display
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderNodeDeselected, (state, action) => {
      // Action intercepted in middleware to control display
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderGetRemoteModules, (state, action) => {
      // Get list of remote actions
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderUpdateModulesList, (state, action) => {
      // Get list of remote actions
      state.modules_list = JSON.stringify(action.payload);
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderUpdateStatusText, (state, action) => {
      state.statustext = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderUpdateNodeInfo, (state, action) => {
      state.nodeinfo = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetRepositoryTarget, (state, action) => {
      state.repo = action.payload as Record<string, string>;
      console.info("[Reducer] " + action.type);
    });
});

export default builderReducer;
