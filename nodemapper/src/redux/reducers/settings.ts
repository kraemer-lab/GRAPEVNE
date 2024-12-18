import { createReducer } from '@reduxjs/toolkit';
import * as actions from '../actions';
import { IModulesListRepo } from './builder';

export interface IRepo {
  active: boolean;
  type: string;
  label: string;
  listing_type: IModulesListRepo['listing_type'];
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

export interface ISettingsState {
  // Settings
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
  vneyard_url: string;
  layout_direction: string;
  edge_type: string;
}

// State
const settingsStateInit: ISettingsState = {
  // Settings
  repositories: [
    // Default - should be overwritten by local state
    {
      active: true,
      type: 'github', // local | github
      label: 'Kraemer Lab',
      listing_type: 'DirectoryListing',
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
  vneyard_url: 'https://kraemer-lab.github.io/vneyard/',
  layout_direction: 'LR',
  edge_type: 'bezier',
};

// Nodemap
const settingsReducer = createReducer(settingsStateInit, (settings) => {
  settings
    .addCase(actions.settingsSetRepositoryTarget, (state, action) => {
      state.repositories = action.payload as IRepo[];
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetSnakemakeArgs, (state, action) => {
      state.snakemake_args = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetDisplayModuleSettings, (state, action) => {
      state.display_module_settings = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetHideParamsInModuleInfo, (state, action) => {
      state.hide_params_in_module_info = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetAutoValidateConnections, (state, action) => {
      state.auto_validate_connections = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsToggleAutoValidateConnections, (state, action) => {
      state.auto_validate_connections = !state.auto_validate_connections;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSelectSnakemakeBackend, (state, action) => {
      state.snakemake_backend = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSelectCondaBackend, (state, action) => {
      state.conda_backend = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetEnvironmentVars, (state, action) => {
      state.environment_variables = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsUpdateSettings, (state, action) => {
      const local_config = action.payload as Record<string, unknown>;
      for (const key in local_config) {
        state[key] = local_config[key];
      }
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsToggleDarkMode, (state, action) => {
      state.dark_mode = !state.dark_mode;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsToggleWorkflowAlertOnSuccessEnabled, (state, action) => {
      state.workflow_alerts.onsuccess.enabled = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsToggleWorkflowAlertOnErrorEnabled, (state, action) => {
      state.workflow_alerts.onerror.enabled = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsEmailSMTPServer, (state, action) => {
      state.workflow_alerts.email_settings.smtp_server = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsEmailSMTPPort, (state, action) => {
      state.workflow_alerts.email_settings.smtp_port = parseInt(action.payload);
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsEmailSender, (state, action) => {
      state.workflow_alerts.email_settings.sender = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsEmailUsername, (state, action) => {
      state.workflow_alerts.email_settings.username = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsEmailPassword, (state, action) => {
      state.workflow_alerts.email_settings.password = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsOnSuccessSubject, (state, action) => {
      state.workflow_alerts.onsuccess.message.subject = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsOnSuccessBody, (state, action) => {
      state.workflow_alerts.onsuccess.message.body = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsOnSuccessRecipients, (state, action) => {
      state.workflow_alerts.onsuccess.message.recipients = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsOnErrorSubject, (state, action) => {
      state.workflow_alerts.onerror.message.subject = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsOnErrorBody, (state, action) => {
      state.workflow_alerts.onerror.message.body = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetWorkflowAlertsOnErrorRecipients, (state, action) => {
      state.workflow_alerts.onerror.message.recipients = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetLayoutDirection, (state, action) => {
      state.layout_direction = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.settingsSetEdgeType, (state, action) => {
      state.edge_type = action.payload;
      console.info('[Reducer] ' + action.type);
    });
});

export default settingsReducer;
