import { createAction } from "@reduxjs/toolkit"

export const runnerAddNode = createAction("runner/add-node");
export const runnerViewSettings = createAction("runner/view-settings");
export const runnerNodeSelected = createAction<Record<string, any> | undefined>("runner/node-selected");  // eslint-disable-line @typescript-eslint/no-explicit-any
export const runnerNodeDeselected = createAction<Record<string,any> | undefined>("runner/node-deselected");  // eslint-disable-line @typescript-eslint/no-explicit-any
export const runnerSelectNone = createAction("runner/select-none");
export const runnerImportSnakefile = createAction("runner/import-snakefile")
export const runnerLoadSnakefile = createAction<string>("runner/load-snakefile")
export const runnerBuildSnakefile = createAction("runner/build-snakefile")
export const runnerLaunchSnakefile = createAction("runner/launch-snakefile")
export const runnerLintSnakefile = createAction("runner/lint-snakefile")
export const runnerQueryJobStatus = createAction("runner/query-job-status")
export const runnerSubmitQuery = createAction<Record<string, any>>("runner/submit-query")  // eslint-disable-line @typescript-eslint/no-explicit-any
export const runnerStoreLint = createAction("runner/store-lint")
export const runnerStoreMap = createAction("runner/store-map")
export const runnerStoreJobStatus = createAction<string>("runner/store-job-status")
export const runnerLoadWorkflow = createAction("runner/load-workflow")
export const runnerUpdateStatusText = createAction<string>("runner/update-status-text")
