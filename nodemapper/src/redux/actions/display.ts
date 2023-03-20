import { createAction } from "@reduxjs/toolkit"

export const displayOpenSettings = createAction("display/open-settings");
export const displayCloseSettings = createAction("display/close-settings");
export const displayToggleSettingsVisibility = createAction("display/toggle-settings-visibility");
export const displayUpdateNodeInfo = createAction<string>("display/update-node-info")
export const displaySaveCodeSnippet = createAction<string>("display/save-codesnippet")
export const displayToggleGraphMoveable = createAction("display/toggle-graph-moveable")
