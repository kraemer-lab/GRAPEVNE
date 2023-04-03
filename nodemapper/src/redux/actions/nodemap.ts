import { createAction } from "@reduxjs/toolkit"

export const nodemapAddNode = createAction("nodemap/add-node");
export const nodemapViewSettings = createAction("nodemap/view-settings");
export const nodemapNodeSelected = createAction<Record<string, any> | undefined>("nodemap/node-selected");  // eslint-disable-line @typescript-eslint/no-explicit-any
export const nodemapNodeDeselected = createAction<Record<string,any> | undefined>("nodemap/node-deselected");  // eslint-disable-line @typescript-eslint/no-explicit-any
export const nodemapSelectNone = createAction("nodemap/select-none");
export const nodemapImportSnakefile = createAction("nodemap/import-snakefile")
export const nodemapBuildSnakefile = createAction("nodemap/build-snakefile")
export const nodemapLintSnakefile = createAction("nodemap/lint-snakefile")
export const nodemapSubmitQuery = createAction<Record<string, any>>("nodemap/submit-query")  // eslint-disable-line @typescript-eslint/no-explicit-any
export const nodemapStoreLint = createAction("nodemap/store-lint")
export const nodemapStoreMap = createAction("nodemap/store-map")
