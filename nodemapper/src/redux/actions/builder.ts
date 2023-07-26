import { createAction } from "@reduxjs/toolkit";

export const builderLoadNodemap = createAction("builder/load-nodemap");

export const builderSaveNodemap = createAction("builder/save-nodemap");

export const builderCompileToJson = createAction("builder/compile-to-json");

export const builderBuildAndRun = createAction("builder/build-and-run");

export const builderRedraw = createAction("builder/redraw");

export const builderGetRemoteModules = createAction(
  "builder/get-remote-modules"
);

export const builderImportModule = createAction("builder/import-module");

export const builderUpdateModulesList = createAction<string>(
  "builder/update-modules-list"
);

export const builderUpdateStatusText = createAction<string>(
  "builder/update-status-text"
);

export const builderUpdateNodeInfo = createAction<string>(
  "builder/update-node-info"
);

export const builderUpdateNodeInfoKey = createAction<
  Record<string, string[] | string>
>("builder/update-node-info-key");

export const builderSetRepositoryTarget = createAction<Record<string, any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
  "builder/set-repository-target"
);

export const builderAddLink = createAction<Record<string, any> | undefined>( // eslint-disable-line @typescript-eslint/no-explicit-any
  "builder/add-link"
);

export const builderNodeSelected = createAction<
  Record<string, any> | undefined // eslint-disable-line @typescript-eslint/no-explicit-any
>("builder/node-selected");

export const builderNodeDeselected = createAction<
  Record<string, any> | undefined // eslint-disable-line @typescript-eslint/no-explicit-any
>("builder/node-deselected");
