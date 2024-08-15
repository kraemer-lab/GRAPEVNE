import { createAction } from '@reduxjs/toolkit';

export const settingsSetDisplayModuleSettings = createAction<boolean>(
  'settings/set-display-module-settings',
);
export const settingsSetAutoValidateConnections = createAction<boolean>(
  'settings/set-auto-validate-connections',
);
export const settingsToggleAutoValidateConnections = createAction(
  'settings/toggle-auto-validate-connections',
);
export const settingsSetHideParamsInModuleInfo = createAction<boolean>(
  'settings/set-hide-params-in-module-info',
);
export const settingsSelectSnakemakeBackend = createAction<string>(
  'settings/select-snakemake-backend',
);
export const settingsSelectCondaBackend = createAction<string>('settings/select-conda-backend');
export const settingsSetEnvironmentVars = createAction<string>('settings/set-environment_vars');
export const settingsSetSnakemakeArgs = createAction<string>('settings/set-snakemake-args');
export const settingsSetRepositoryTarget = createAction<Record<string, any>>(
  'settings/set-repository-target',
);
export const settingsUpdateSettings = createAction<Record<string, unknown>>(
  'settings/update-settings',
);
export const settingsToggleDarkMode = createAction('settings/toggle-dark-mode');
export const settingsReadStoreConfig = createAction('settings/read-store-config');
export const settingsWriteStoreConfig = createAction('settings/write-store-config');
export const settingsToggleWorkflowAlertOnSuccessEnabled = createAction<boolean>(
  'settings/toggle-workflow-alert-on-success-enabled',
);
export const settingsToggleWorkflowAlertOnErrorEnabled = createAction<boolean>(
  'settings/toggle-workflow-alert-on-error-enabled',
);
export const settingsSetWorkflowAlertsEmailSMTPServer = createAction<string>(
  'settings/set-workflow-alerts-email-smtp-server',
);
export const settingsSetWorkflowAlertsEmailSMTPPort = createAction<string>(
  'settings/set-workflow-alerts-email-smtp-port',
);
export const settingsSetWorkflowAlertsEmailSender = createAction<string>(
  'settings/set-workflow-alerts-email-sender',
);
export const settingsSetWorkflowAlertsEmailUsername = createAction<string>(
  'settings/set-workflow-alerts-email-username',
);
export const settingsSetWorkflowAlertsEmailPassword = createAction<string>(
  'settings/set-workflow-alerts-email-password',
);
export const settingsSetWorkflowAlertsOnSuccessSubject = createAction<string>(
  'settings/set-workflow-alerts-onsuccess-subject',
);
export const settingsSetWorkflowAlertsOnSuccessBody = createAction<string>(
  'settings/set-workflow-alerts-onsuccess-body',
);
export const settingsSetWorkflowAlertsOnSuccessRecipients = createAction<string>(
  'settings/set-workflow-alerts-onsuccess-recipients',
);
export const settingsSetWorkflowAlertsOnErrorSubject = createAction<string>(
  'settings/set-workflow-alerts-onerror-subject',
);
export const settingsSetWorkflowAlertsOnErrorBody = createAction<string>(
  'settings/set-workflow-alerts-onerror-body',
);
export const settingsSetWorkflowAlertsOnErrorRecipients = createAction<string>(
  'settings/set-workflow-alerts-onerror-recipients',
);
