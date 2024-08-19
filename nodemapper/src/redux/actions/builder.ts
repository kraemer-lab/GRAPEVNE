import { createAction } from '@reduxjs/toolkit';
import { Node } from 'gui/Builder/components/Flow';
import { Edge } from 'reactflow';
import { IModulesList } from 'redux/reducers/builder';

export const builderSetNodes = createAction<Node[]>('builder/set-nodes');
export const builderAddNode = createAction<Node>('builder/add-node');
export const builderAddNodes = createAction<Node[]>('builder/add-nodes');
export const builderUpdateNode = createAction<Node>('builder/update-node');
export const builderSetEdges = createAction<Edge[]>('builder/set-edges');
export const builderExportAsPNG = createAction('builder/export-as-png');
export const builderExportAsSVG = createAction('builder/export-as-svg');
export const builderLoadNodemap = createAction('builder/load-nodemap');
export const builderSaveNodemap = createAction('builder/save-nodemap');
export const builderBuildInProgress = createAction<boolean>('builder/build-in-progress');
export const builderBuildAsModule = createAction<string | undefined>('builder/build-as-module');
export const builderBuildAsWorkflow = createAction('builder/build-as-workflow');
export const builderPackageWorkflow = createAction('builder/package-workflow');
export const builderBuildAndRun = createAction('builder/build-and-run');
export const builderBuildAndRunToModule = createAction<string>('builder/build-and-run-to-module');
export const builderBuildAndForceRunToModule = createAction<string>(
  'builder/build-and-force-run-to-module',
);
export const builderCleanBuildFolder = createAction('builder/clean-build-folder');
export const builderGetRemoteModules = createAction('builder/get-remote-modules');
export const builderUpdateModulesList = createAction<IModulesList>('builder/update-modules-list');
export const builderCheckNodeDependencies = createAction<string>('builder/check-node-dependencies');
export const builderUpdateStatusText = createAction<string>('builder/update-status-text');
export const builderUpdateNodeInfo = createAction<string>('builder/update-node-info');
export const builderUpdateNodeInfoKey = createAction<Record<string, string[] | string>>(
  'builder/update-node-info-key',
);
export const builderUpdateNodeInfoName = createAction<string>('builder/update-node-info-name');
export const builderLogEvent = createAction<string>('builder/log-event');
export const builderAddLink = createAction<Record<string, any> | undefined>('builder/add-link');
export const builderNodeSelected = createAction<Node>('builder/node-selected');
export const builderNodeSelectedByID = createAction<string>('builder/node-selected-by-id');
export const builderNodeDeselected = createAction('builder/node-deselected');
export const builderSetConfigFiles = createAction<string[]>('builder/set-config-files');
export const builderOpenResultsFolder = createAction('builder/open-results-folder');
export const builderUpdateWorkdir = createAction<string>('builder/update-workdir');
export const builderLoadScene = createAction('builder/load-scene');
export const builderSaveScene = createAction('builder/save-scene');
export const builderSetModulesLoading = createAction<boolean>('builder/set-modules-loading');
export const builderSetTerminalMounted = createAction<boolean>('builder/set-terminal-mounted');
