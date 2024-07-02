import * as actions from '../actions';

import { createReducer } from '@reduxjs/toolkit';
import { Edge, Node } from 'NodeMap/scene/Flow';
import { ConfigPaneDisplay } from 'redux/types';

export interface IRepo {
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
  terminal_visibile: boolean;
  config_pane_display: string;
  logtext: string;
  workdir: string;
  modules_loading: boolean;
  build_in_progress: boolean;

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
  hide_params_in_module_info: boolean;
  dark_mode: boolean;
  workflow_alerts: IWorkflowAlerts;
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
  workdir: '',
  modules_loading: false,
  build_in_progress: false,

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
  hide_params_in_module_info: true,
  dark_mode: false,
  workflow_alerts: {
    email_settings: {
      smtp_server: 'smtp.gmail.com',
      smtp_port: 587,
      sender: '',
      username: '',
      password: '',
    },
    onsuccess: {
      enabled: false,
      message: {
        subject: 'Workflow completed successfully',
        body: 'Workflow completed successfully',
        recipients: '',
      },
    },
    onerror: {
      enabled: false,
      message: {
        subject: 'Workflow failure',
        body: 'Workflow failure',
        recipients: '',
      },
    },
  },
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
      state.statustext = setStatusText(action.payload);
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
    .addCase(actions.builderSetHideParamsInModuleInfo, (state, action) => {
      state.hide_params_in_module_info = action.payload;
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
    .addCase(actions.builderToggleWorkflowAlertOnSuccessEnabled, (state, action) => {
      state.workflow_alerts.onsuccess.enabled = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderToggleWorkflowAlertOnErrorEnabled, (state, action) => {
      state.workflow_alerts.onerror.enabled = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsEmailSMTPServer, (state, action) => {
      state.workflow_alerts.email_settings.smtp_server = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsEmailSMTPPort, (state, action) => {
      state.workflow_alerts.email_settings.smtp_port = parseInt(action.payload);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsEmailSender, (state, action) => {
      state.workflow_alerts.email_settings.sender = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsEmailUsername, (state, action) => {
      state.workflow_alerts.email_settings.username = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsEmailPassword, (state, action) => {
      state.workflow_alerts.email_settings.password = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsOnSuccessSubject, (state, action) => {
      state.workflow_alerts.onsuccess.message.subject = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsOnSuccessBody, (state, action) => {
      state.workflow_alerts.onsuccess.message.body = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsOnSuccessRecipients, (state, action) => {
      state.workflow_alerts.onsuccess.message.recipients = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsOnErrorSubject, (state, action) => {
      state.workflow_alerts.onerror.message.subject = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsOnErrorBody, (state, action) => {
      state.workflow_alerts.onerror.message.body = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.builderSetWorkflowAlertsOnErrorRecipients, (state, action) => {
      state.workflow_alerts.onerror.message.recipients = action.payload;
      console.info('[Reducer] ' + action.type);
    });
});

const setStatusText = (text: string) => {
  if (text === '' || text === ' ' || text === null || text === undefined) text = 'Idle';
  return text;
};

const addLogEvent = (state: IBuilderState, text: string) => {
  if (state.logtext === ' ') state.logtext = '';
  if (text[text.length - 1] !== '\n') text += '\n';
  state.logtext += text;
  if (state.logtext === '') state.logtext = ' ';
};

export default builderReducer;
