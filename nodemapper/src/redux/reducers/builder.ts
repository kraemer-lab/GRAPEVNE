import BuilderEngine from "gui/Builder/BuilderEngine";
import { createReducer } from "@reduxjs/toolkit";
import * as actions from "../actions";

interface IBuilderState {
  repo: string;
  modules_list: string;
  statustext: string;
  nodeinfo: string;
  can_selected_expand: boolean;
  terminal_visibile: boolean;
  settings_visible: boolean;
  snakemake_args: string;
  auto_validate_connections: boolean;
}

// State
const builderStateInit: IBuilderState = {
  repo: JSON.stringify({
    type: "github", // local | github
    listing_type: "DirectoryListing", // DirectoryListing | BranchListing
    repo: "kraemer-lab/vneyard", // local path or github repo (user/repo)
  }),
  modules_list: "[]",
  statustext: "",
  nodeinfo: "{}", // {} requires to be a valid JSON string
  can_selected_expand: true,
  terminal_visibile: false,
  settings_visible: false,
  snakemake_args: "--cores 1 --use-conda $(snakemake --list)",
  auto_validate_connections: false,
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
    .addCase(actions.builderUpdateNodeInfoKey, (state, action) => {
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetRepositoryTarget, (state, action) => {
      state.repo = JSON.stringify(action.payload);
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderToggleTerminalVisibility, (state, action) => {
      state.terminal_visibile = !state.terminal_visibile;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderOpenTerminal, (state, action) => {
      state.terminal_visibile = true;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderToggleSettingsVisibility, (state, action) => {
      state.settings_visible = !state.settings_visible;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetSnakemakeArgs, (state, action) => {
      state.snakemake_args = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetAutoValidateConnections, (state, action) => {
      state.auto_validate_connections = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderToggleAutoValidateConnections, (state, action) => {
      state.auto_validate_connections = !state.auto_validate_connections;
      console.info("[Reducer] " + action.type);
    });
});

export default builderReducer;
