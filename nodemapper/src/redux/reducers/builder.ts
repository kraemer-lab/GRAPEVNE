import * as actions from '../actions';

import { createReducer } from '@reduxjs/toolkit';
import { Edge, Node } from 'NodeMap/scene/Flow';
import { ConfigPaneDisplay } from 'redux/types';

export interface IRepo {
  active: boolean;
  type: string;
  label: string;
  listing_type: string;
  repo: string;
}

export interface IWorkflowAlertEmail {
  smtp_server: string;
  smtp_port: number;
  sender: string;
  username: string;
  password: string;
}

export interface IWorkflowAlertMessage {
  subject: string;
  body: string;
  recipients: string;
}

export interface IWorkflowAlert {
  enabled: boolean;
  message: IWorkflowAlertMessage;
}

export interface IWorkflowAlerts {
  onsuccess: IWorkflowAlert;
  onerror: IWorkflowAlert;
  email_settings: IWorkflowAlertEmail;
}

export interface IBuilderState {
  // Builder state
  statustext: string;
  nodeinfo: string;
  modules_list: string;
  can_selected_expand: boolean;
  config_pane_display: string;
  logtext: string;
  workdir: string;
  modules_loading: boolean;
  build_in_progress: boolean;
  configfiles_list: string[];
  terminal_mounted: boolean;

  // react-flow parameters
  nodes: Node[];
  edges: Edge[];
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
  config_pane_display: ConfigPaneDisplay.None,
  logtext: ' ',
  modules_list: '[]',
  workdir: '',
  modules_loading: false,
  build_in_progress: false,
  configfiles_list: [],
  terminal_mounted: false,

  // react-flow parameters
  nodes: default_nodes,
  edges: default_edges,
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
      // Accepts string representation or JSON (modules_list should be a list!)
      if (typeof action.payload === 'string') state.modules_list = action.payload;
      else state.modules_list = JSON.stringify(action.payload);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateStatusText, (state, action) => {
      // Accepts strings or {msg: string}
      if (Object.keys(action.payload).length === 0) state.statustext = 'Idle';
      if (typeof action.payload === 'string') state.statustext = action.payload;
      else if ('msg' in action.payload) state.statustext = action.payload['msg'];
      else state.statustext = 'WARNING: Unknown status message format';
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateNodeInfo, (state, action) => {
      state.nodeinfo = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateNodeInfoKey, (state, action) => {
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderLogEvent, (state, action) => {
      let text = '';
      if (typeof action.payload === 'string') text = action.payload;
      else if ('msg' in action.payload) text = action.payload['msg'];
      else text = 'WARNING: Unknown log format';
      addLogEvent(state, text);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderUpdateWorkdir, (state, action) => {
      state.workdir = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetModulesLoading, (state, action) => {
      state.modules_loading = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderBuildInProgress, (state, action) => {
      state.build_in_progress = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetConfigFiles, (state, action) => {
      state.configfiles_list = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetTerminalMounted, (state, action) => {
      state.terminal_mounted = action.payload;
      console.info('[Reducer] ' + action.type);
    });
});

const addLogEvent = (state: IBuilderState, text: string) => {
  text = text.trim();
  if (text === '') return;
  text += '\n';
  if (state.logtext === ' ') state.logtext = '';
  console.log('Log text: ', text);
  state.logtext += text;
  if (state.logtext === '') state.logtext = ' ';
};

export default builderReducer;
