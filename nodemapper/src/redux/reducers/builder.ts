import BuilderEngine from "gui/Builder/BuilderEngine";
import { createReducer } from "@reduxjs/toolkit";
import * as actions from "../actions";
import { ConfigPaneDisplay } from "redux/types";

import { Node } from "reactflow";
import { Edge } from "reactflow";
import { OnNodesChange } from "reactflow";
import { OnEdgesChange } from "reactflow";
import { OnConnect } from "reactflow";

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
  repo: string;
  modules_list: string;
  snakemake_backend: string;
  snakemake_args: string;
  conda_backend: string;
  environment_variables: string;
  display_module_settings: boolean;
  auto_validate_connections: boolean;

  // TODO: Remove these options
  settings_visible: boolean;
}

const default_nodes = [
  {
    // Source
    id: "0",
    type: "standard",
    data: {
      config: {
        name: "test-s1",
        type: "source",
        snakefile: "Snakefile",
        config: {
          input_namespace: null,
          output_namespace: "out",
          params: {
            param1: "value1",
            param2: "value2",
          },
        },
      },
    },
    position: { x: 100, y: 50 },
  },
  {
    // Module (one output_namespace)
    id: "1",
    type: "standard",
    data: {
      config: {
        name: "test-m1",
        type: "module",
        snakefile: "Snakefile",
        config: {
          input_namespace: "in",
          output_namespace: "out",
          params: {
            param1: "value1",
            param2: "value2",
          },
        },
      },
    },
    position: { x: 300, y: 50 },
  },
  {
    // Module (two output_namespaces)
    id: "2",
    type: "standard",
    data: {
      config: {
        name: "test-m2",
        type: "module",
        snakefile: "Snakefile",
        config: {
          input_namespace: {
            in1key: "in1value",
            in2key: "in2value",
          },
          output_namespace: "out",
          params: {
            param1: "value1",
            param2: "value2",
          },
        },
      },
    },
    position: { x: 500, y: 50 },
  },
] as Node[];

const default_edges = [
  { id: "e1-2", source: "0", target: "1" },
  { id: "e2-3", source: "1", target: "2" },
] as Edge[];

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
  repo: JSON.stringify([
    // Default - should be overwritten by master list (downloaded from url)
    /*{
      type: "github", // local | github
      label: "Kraemer Lab",
      listing_type: "DirectoryListing", // LocalFilesystem | DirectoryListing | BranchListing
      repo: "kraemer-lab/vneyard",
    },*/
    {
      type: "local", // local | github
      label: "Snakeshack",
      listing_type: "DirectoryListing", // LocalFilesystem | DirectoryListing | BranchListing
      repo: "/Users/jsb/repos/jsbrittain/snakeshack",
    },
  ]),
  modules_list: "[]",
  snakemake_backend: "builtin", // builtin | system
  snakemake_args: "--cores 1 --use-conda --force", // $(snakemake --list)
  conda_backend: "builtin", // builtin | system
  environment_variables: "",
  display_module_settings: false,
  auto_validate_connections: false,

  // TODO: Remove these options
  settings_visible: false,
};

// Nodemap
const builderReducer = createReducer(builderStateInit, (builder) => {
  builder
    .addCase(actions.builderSetNodes, (state, action) => {
      state.nodes = action.payload as Node[];
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderAddNode, (state, action) => {
      state.nodes = state.nodes.concat(action.payload as Node);
      console.info("[Reducer] " + action.type);
    })
    .addCase(actions.builderSetEdges, (state, action) => {
      state.edges = action.payload as Edge[];
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
