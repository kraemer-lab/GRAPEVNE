import * as actions from '../actions';

import { createReducer } from '@reduxjs/toolkit';
import { Edge, Node } from 'NodeMap/scene/Flow';
import { ConfigPaneDisplay } from 'redux/types';

const displayAPI = window.displayAPI;

export interface IRepo {
  type: string;
  label: string;
  listing_type: string;
  repo: string;
}

export interface IBuilderState {
  // Builder state
  statustext: string;
  nodeinfo: string;
  modules_list: string;
  can_selected_expand: boolean;
  terminal_visibile: boolean;
  config_pane_display: string;
  logtext: string;

  // react-flow parameters
  nodes: Node[];
  edges: Edge[];

  // Settings -- TODO: Move to separate reducer
  repositories: IRepo[];
  snakemake_backend: string;
  snakemake_args: string;
  conda_backend: string;
  environment_variables: string;
  display_module_settings: boolean;
  auto_validate_connections: boolean;
  package_modules_in_workflow: boolean;
  dark_mode: boolean;
}

// Defaults
const default_nodes = [] as Node[];
const default_edges = [] as Edge[];

// State
const builderStateInit: IBuilderState = {
  // Builder state
  statustext: 'Idle',
  nodeinfo: '{}', // {} required to be a valid JSON string
  can_selected_expand: true,
  terminal_visibile: false,
  config_pane_display: ConfigPaneDisplay.None,
  logtext: ' ',
  modules_list: '[]',

  // react-flow parameters
  nodes: default_nodes,
  edges: default_edges,

  // Settings -- TODO: Move to separate reducer
  repositories: [
    // Default - should be overwritten by local state
    {
      type: 'github', // local | github
      label: 'Kraemer Lab',
      listing_type: 'DirectoryListing', // LocalFilesystem | DirectoryListing | BranchListing
      repo: 'kraemer-lab/vneyard',
    },
  ],
  snakemake_backend: 'builtin', // builtin | system
  snakemake_args: '--cores 1 --use-conda',
  conda_backend: 'builtin', // builtin | system
  environment_variables: '',
  display_module_settings: false,
  auto_validate_connections: false,
  package_modules_in_workflow: false,
  dark_mode: false,
};

// Nodemap
const builderReducer = createReducer(builderStateInit, (builder) => {
  builder
    .addCase(actions.builderSetNodes, (state, action) => {
      state.nodes = action.payload as Node[];
      console.log('Set nodes: ', state.nodes);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderAddNode, (state, action) => {
      state.nodes = state.nodes.concat(action.payload as Node);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderAddNodes, (state, action) => {
      state.nodes = state.nodes.concat(action.payload as Node[]);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetEdges, (state, action) => {
      state.edges = action.payload as Edge[];
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateNode, (state, action) => {
      const newnode = action.payload as Node;
      state.nodes = state.nodes.map((node) => {
        return node.id === newnode.id ? newnode : node;
      });
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderLoadNodemap, (state, action) => {
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSaveNodemap, (state, action) => {
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderBuildAsModule, (state, action) => {
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderBuildAsWorkflow, (state, action) => {
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderAddLink, (state, action) => {
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderNodeSelected, (state, action) => {
      // Action intercepted in middleware to control display
      state.config_pane_display = ConfigPaneDisplay.Node;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderNodeSelectedByID, (state, action) => {
      // Action intercepted in middleware to control display
      state.config_pane_display = ConfigPaneDisplay.Node;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderNodeDeselected, (state, action) => {
      // Action intercepted in middleware to control display
      state.config_pane_display = ConfigPaneDisplay.None;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderGetRemoteModules, (state, action) => {
      // Get list of remote actions
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateModulesList, (state, action) => {
      state.modules_list = JSON.stringify(action.payload);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateStatusText, (state, action) => {
      setStatusText(state, action.payload);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateNodeInfo, (state, action) => {
      state.nodeinfo = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateNodeInfoKey, (state, action) => {
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetRepositoryTarget, (state, action) => {
      state.repositories = action.payload as IRepo[];
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderToggleTerminalVisibility, (state, action) => {
      state.terminal_visibile = !state.terminal_visibile;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderOpenTerminal, (state, action) => {
      state.terminal_visibile = true;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetSnakemakeArgs, (state, action) => {
      state.snakemake_args = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetDisplayModuleSettings, (state, action) => {
      state.display_module_settings = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetAutoValidateConnections, (state, action) => {
      state.auto_validate_connections = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderToggleAutoValidateConnections, (state, action) => {
      state.auto_validate_connections = !state.auto_validate_connections;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetPackageModulesInWorkflow, (state, action) => {
      state.package_modules_in_workflow = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSelectSnakemakeBackend, (state, action) => {
      state.snakemake_backend = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSelectCondaBackend, (state, action) => {
      state.conda_backend = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetEnvironmentVars, (state, action) => {
      state.environment_variables = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderLogEvent, (state, action) => {
      addLogEvent(state, action.payload);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateSettings, (state, action) => {
      const local_config = action.payload as Record<string, unknown>;
      for (const key in local_config) {
        state[key] = local_config[key];
      }
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderToggleDarkMode, (state, action) => {
      state.dark_mode = !state.dark_mode;
      console.info('[Reducer] ' + action.type);
    });
});

const setStatusText = (state: IBuilderState, text: string) => {
  if (text === '' || text === null || text === undefined) text = 'Idle';
  state.statustext = text;
  return state;
};

const addLogEvent = (state: IBuilderState, text: string) => {
  if (state.logtext === ' ') state.logtext = '';
  if (text[text.length - 1] !== '\n') text += '\n';
  state.logtext += text;
  if (state.logtext === '') state.logtext = ' ';
};

export default builderReducer;
