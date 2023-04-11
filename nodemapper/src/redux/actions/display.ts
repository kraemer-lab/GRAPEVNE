import { createAction } from "@reduxjs/toolkit"

export const displayOpenSettings = createAction("display/open-settings");
export const displayCloseSettings = createAction("display/close-settings");
export const displayToggleSettingsVisibility = createAction("display/toggle-settings-visibility");
export const displayUpdateNodeInfo = createAction<string>("display/update-node-info")
export const displaySaveCodeSnippet = createAction<string>("display/save-codesnippet")
export const displayZoomToFit = createAction("display/zoom-to-fit")
export const displayGetFolderInfo = createAction("display/get-folder-info")
export const displaySetFolder = createAction<string>("display/set-folder")
export const displaySetFilename = createAction<string>("display/set-filename")
export const displayStoreFolderInfo = createAction<string>("display/store-folder-info")
export const displayDeleteResults = createAction("display/delete-results")
