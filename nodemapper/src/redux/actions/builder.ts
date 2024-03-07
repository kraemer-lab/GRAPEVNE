import { createAction } from '@reduxjs/toolkit';
import { Node } from 'gui/Builder/components/Flow';
import { Edge } from 'reactflow';

export const builderSetNodes = createAction<Node[]>('builder/set-nodes');
export const builderAddNode = createAction<Node>('builder/add-node');
export const builderAddNodes = createAction<Node[]>('builder/add-nodes');
export const builderUpdateNode = createAction<Node>('builder/update-node');
export const builderSetEdges = createAction<Edge[]>('builder/set-edges');
export const builderExportAsPNG = createAction('builder/export-as-png');
export const builderExportAsSVG = createAction('builder/export-as-svg');

export const builderLoadNodemap = createAction('builder/load-nodemap');
export const builderSaveNodemap = createAction('builder/save-nodemap');

export const builderSetAutoValidateConnections = createAction<boolean>(
  'builder/set-auto-validate-connections',
);
export const builderToggleAutoValidateConnections = createAction(
  'builder/toggle-auto-validate-connections',
);
export const builderSetPackageModulesInWorkflow = createAction<boolean>(
  'builder/set-package-modules-in-workflow',
);

export const builderBuildAsModule = createAction('builder/build-as-module');
export const builderBuildAsWorkflow = createAction('builder/build-as-workflow');
export const builderOpenTerminal = createAction('builder/open-terminal');
export const builderBuildAndRun = createAction('builder/build-and-run');
export const builderBuildAndRunToModule = createAction<string>('builder/build-and-run-to-module');
export const builderBuildAndForceRunToModule = createAction<string>(
  'builder/build-and-force-run-to-module',
);
export const builderCleanBuildFolder = createAction('builder/clean-build-folder');
export const builderGetRemoteModules = createAction('builder/get-remote-modules');

export const builderToggleTerminalVisibility = createAction('builder/toggle-terminal-visibility');
export const builderSetDisplayModuleSettings = createAction<boolean>(
  'builder/set-display-module-settings',
);

export const builderSelectSnakemakeBackend = createAction<string>(
  'builder/select-snakemake-backend',
);
export const builderSelectCondaBackend = createAction<string>('builder/select-conda-backend');
export const builderSetEnvironmentVars = createAction<string>('builder/set-environment_vars');
export const builderUpdateModulesList = createAction<string>('builder/update-modules-list');
export const builderCheckNodeDependencies = createAction<string>('builder/check-node-dependencies');
export const builderUpdateStatusText = createAction<string>('builder/update-status-text');
export const builderUpdateNodeInfo = createAction<string>('builder/update-node-info');
export const builderUpdateNodeInfoKey = createAction<Record<string, string[] | string>>(
  'builder/update-node-info-key',
);
export const builderUpdateNodeInfoName = createAction<string>('builder/update-node-info-name');
export const builderSetSnakemakeArgs = createAction<string>('builder/set-snakemake-args');
export const builderLogEvent = createAction<string>('builder/log-event');
export const builderSetRepositoryTarget = createAction<Record<string, any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
  'builder/set-repository-target',
);
export const builderAddLink = createAction<Record<string, any> | undefined>('builder/add-link'); // eslint-disable-line @typescript-eslint/no-explicit-any
export const builderNodeSelected = createAction<Node>('builder/node-selected');
export const builderNodeSelectedByID = createAction<string>('builder/node-selected-by-id');
export const builderNodeDeselected = createAction('builder/node-deselected');
export const builderUpdateSettings =
  createAction<Record<string, unknown>>('builder/update-settings');
export const builderReadStoreConfig = createAction('builder/read-store-config');
export const builderWriteStoreConfig = createAction('builder/write-store-config');

export const builderToggleDarkMode = createAction('builder/toggle-dark-mode');
export const builderOpenResultsFolder = createAction('builder/open-results-folder');
export const builderUpdateWorkdir = createAction<string>('builder/update-workdir');

export const builderLoadScene = createAction('builder/load-scene');
export const builderSaveScene = createAction('builder/save-scene');
export const builderSetModulesLoading = createAction<boolean>('builder/set-modules-loading');
export const builderSetHideParamsInModuleInfo = createAction<boolean>(
  'builder/set-hide-params-in-module-info',
);
