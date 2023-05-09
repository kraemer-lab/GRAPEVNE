import { createAction } from "@reduxjs/toolkit"

export const builderLoadNodemap = createAction("builder/load-nodemap");
export const builderSaveNodemap = createAction("builder/save-nodemap");
export const builderCompileToJson = createAction("builder/compile-to-json");
export const builderSubmitQuery = createAction<Record<string, any>>("builder/submit-query")  // eslint-disable-line @typescript-eslint/no-explicit-any
export const builderNodeSelected = createAction<Record<string, any> | undefined>("builder/node-selected");  // eslint-disable-line @typescript-eslint/no-explicit-any
export const builderNodeDeselected = createAction<Record<string, any> | undefined>("builder/node-deselected");  // eslint-disable-line @typescript-eslint/no-explicit-any
export const builderGetRemoteModules = createAction("builder/get-remote-modules");
export const builderUpdateModulesList = createAction<string>("builder/update-modules-list");
