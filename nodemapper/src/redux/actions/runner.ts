import { createAction } from '@reduxjs/toolkit';

export const runnerAddNode = createAction('runner/add-node');
export const runnerStoreMap = createAction<string>('runner/store-map');
export const runnerStoreLint = createAction<string>('runner/store-lint');
export const runnerSelectNone = createAction('runner/select-none');
export const runnerViewSettings = createAction('runner/view-settings');
export const runnerLoadWorkflow = createAction('runner/load-workflow');
export const runnerLintSnakefile = createAction('runner/lint-snakefile');
export const runnerQueryJobStatus = createAction('runner/query-job-status');
export const runnerBuildSnakefile = createAction('runner/build-snakefile');
export const runnerImportSnakefile = createAction('runner/import-snakefile');
export const runnerLaunchSnakefile = createAction('runner/launch-snakefile');
export const runnerStoreJobStatus = createAction<string>('runner/store-job-status');
export const runnerUpdateStatusText = createAction<string>('runner/update-status-text');
export const runnerLoadSnakefile = createAction<string>('runner/load-snakefile');
export const runnerNodeSelected = createAction<Record<string, any> | undefined>(
  'runner/node-selected',
);
export const runnerNodeDeselected = createAction<Record<string, any> | undefined>(
  'runner/node-deselected',
);
