import BuilderEngine from "gui/Builder/BuilderEngine";
import { createReducer } from "@reduxjs/toolkit";
import * as actions from "../actions";
import { ConfigPaneDisplay } from "redux/types";

interface IBuilderState {
  repo: string;
  modules_list: string;
  statustext: string;
  nodeinfo: string;
  can_selected_expand: boolean;
  terminal_visibile: boolean;
  settings_visible: boolean;
  snakemake_backend: string;
  snakemake_args: string;
  conda_backend: string;
  environment_variables: string;
  display_module_settings: boolean;
  auto_validate_connections: boolean;
  config_pane_display: string;
  logtext: string;
}

// State
const builderStateInit: IBuilderState = {
  repo: JSON.stringify([
    // Default - should be overwritten by master list (downloaded from url)
    {
      type: "github", // local | github
      label: "Kraemer Lab",
      listing_type: "DirectoryListing", // LocalFilesystem | DirectoryListing | BranchListing
      repo: "kraemer-lab/vneyard",
    },
  ]),
  modules_list: "[]",
  statustext: "Idle",
  nodeinfo: "{}", // {} required to be a valid JSON string
  can_selected_expand: true,
  terminal_visibile: false,
  settings_visible: false,
  snakemake_backend: "builtin", // builtin | system
  snakemake_args: "--cores 1 --use-conda", // $(snakemake --list)
  conda_backend: "builtin", // builtin | system
  environment_variables: "",
  display_module_settings: false,
  auto_validate_connections: false,
  config_pane_display: ConfigPaneDisplay.None,
  logtext: " ",
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
    .addCase(actions.builderBuildAsModule, (state, action) => {
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderBuildAsWorkflow, (state, action) => {
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
      state.config_pane_display = ConfigPaneDisplay.Node;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderNodeDeselected, (state, action) => {
      // Action intercepted in middleware to control display
      state.config_pane_display = state.settings_visible
        ? ConfigPaneDisplay.Settings
        : ConfigPaneDisplay.None;
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
      setStatusText(state, action.payload);
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
    .addCase(actions.builderSetSettingsVisibility, (state, action) => {
      state.settings_visible = action.payload;
      state.config_pane_display = state.settings_visible
        ? ConfigPaneDisplay.Settings
        : ConfigPaneDisplay.None;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderToggleSettingsVisibility, (state, action) => {
      state.settings_visible = !state.settings_visible;
      state.config_pane_display = state.settings_visible
        ? ConfigPaneDisplay.Settings
        : ConfigPaneDisplay.None;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetSnakemakeArgs, (state, action) => {
      state.snakemake_args = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetDisplayModuleSettings, (state, action) => {
      state.display_module_settings = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetAutoValidateConnections, (state, action) => {
      state.auto_validate_connections = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderToggleAutoValidateConnections, (state, action) => {
      state.auto_validate_connections = !state.auto_validate_connections;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSelectSnakemakeBackend, (state, action) => {
      state.snakemake_backend = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSelectCondaBackend, (state, action) => {
      state.conda_backend = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetEnvironmentVars, (state, action) => {
      state.environment_variables = action.payload;
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderLogEvent, (state, action) => {
      addLogEvent(state, action.payload);
      console.info("[Reducer] " + action.type);
    });
});

const setStatusText = (state: IBuilderState, text: string) => {
  if (text === "" || text === null || text === undefined) text = "Idle";
  state.statustext = text;
  return state;
};

const addLogEvent = (state: IBuilderState, text: string) => {
  if (state.logtext === " ") state.logtext = "";
  if (text[text.length - 1] !== "\n") text += "\n";
  state.logtext += text;
  if (state.logtext === "") state.logtext = " ";
};

export { IBuilderState };
export default builderReducer;
