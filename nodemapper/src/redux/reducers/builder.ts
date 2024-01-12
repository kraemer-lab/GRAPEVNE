import BuilderEngine from "gui/Builder/BuilderEngine";
import { createReducer } from "@reduxjs/toolkit";
import * as actions from "../actions";
import { ConfigPaneDisplay } from "redux/types";

import { Node } from "reactflow";
import { Edge } from "reactflow";
import { OnNodesChange } from "reactflow";
import { OnEdgesChange } from "reactflow";
import { OnConnect } from "reactflow";

const displayAPI = window.displayAPI;

interface IBuilderState {
  // Builder state
  statustext: string;
  nodeinfo: string;
  can_selected_expand: boolean;
  terminal_visibile: boolean;
  config_pane_display: string;
  logtext: string;

  // react-flow parameters (experimental)
  nodes: Node[];
  edges: Edge[];

  // Settings -- TODO: Move to separate reducer
  repositories: Record<string, string>[];
  modules_list: string;
  snakemake_backend: string;
  snakemake_args: string;
  conda_backend: string;
  environment_variables: string;
  display_module_settings: boolean;
  auto_validate_connections: boolean;
}

// Defaults
const default_nodes = [] as Node[];
const default_edges = [] as Edge[];

// State
const builderStateInit: IBuilderState = {
  // Builder state
  statustext: "Idle",
  nodeinfo: "{}", // {} required to be a valid JSON string
  can_selected_expand: true,
  terminal_visibile: false,
  config_pane_display: ConfigPaneDisplay.None,
  logtext: " ",

  // react-flow parameters (experimental)
  nodes: default_nodes,
  edges: default_edges,

  // Settings -- TODO: Move to separate reducer
  repositories: [
    // Default - should be overwritten by local state (and master list, downloaded from url)
    {
      type: "github", // local | github
      label: "Kraemer Lab",
      listing_type: "DirectoryListing", // LocalFilesystem | DirectoryListing | BranchListing
      repo: "kraemer-lab/vneyard",
    },
    /*{
      type: "local", // local | github
      label: "Snakeshack",
      listing_type: "DirectoryListing", // LocalFilesystem | DirectoryListing | BranchListing
      repo: "/Users/jsb/repos/jsbrittain/snakeshack",
    },*/
  ],
  modules_list: "[]",
  snakemake_backend: "builtin", // builtin | system
  snakemake_args: "--cores 1 --use-conda",
  conda_backend: "builtin", // builtin | system
  environment_variables: "",
  display_module_settings: false,
  auto_validate_connections: false,
};

// Write persistent state to electron frontend
const store_write_config = async () => {
  displayAPI.StoreWriteConfig({
    'repositories': builderStateInit.repositories,
    'snakemake_backend': builderStateInit.snakemake_backend,
    'snakemake_args': builderStateInit.snakemake_args,
    'conda_backend': builderStateInit.conda_backend,
    'environment_variables': builderStateInit.environment_variables,
    'display_module_settings': builderStateInit.display_module_settings,
    'auto_validate_connections': builderStateInit.auto_validate_connections,
  });
}

// Read persistent state from electron frontend
const store_read_config = async () => {
  const local_config = await displayAPI.StoreReadConfig();
  console.log("Local config: ", local_config);
  for (const key in local_config) {
    console.log("Setting key: ", key, " to ", local_config[key]);
    builderStateInit[key] = local_config[key];
  }
}
store_read_config();

// Nodemap
const builderReducer = createReducer(builderStateInit, (builder) => {
  builder
    .addCase(actions.builderSetNodes, (state, action) => {
      state.nodes = action.payload as Node[];
      console.log("Set nodes: ", state.nodes);
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderAddNode, (state, action) => {
      state.nodes = state.nodes.concat(action.payload as Node);
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderAddNodes, (state, action) => {
      state.nodes = state.nodes.concat(action.payload as Node[]);
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetEdges, (state, action) => {
      state.edges = action.payload as Edge[];
      console.log("Set edges: ", state.edges);
      console.info("[Reducer] " + action.type);
    })
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
      state.repositories = action.payload as Record<string, string>[];
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
