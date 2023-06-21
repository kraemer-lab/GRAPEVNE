import { createAction } from "@reduxjs/toolkit";

export const displayZoomToFit = createAction("display/zoom-to-fit");
export const displayDeleteResults = createAction("display/delete-results");
export const displayGetFolderInfo = createAction("display/get-folder-info");
export const displayUpdateNodeInfo = createAction<string>(
  "display/update-node-info"
);
export const displaySaveCodeSnippet = createAction<string>(
  "display/save-codesnippet"
);
export const displaySetFolder = createAction<string>("display/set-folder");
export const displaySetFilename = createAction<string>("display/set-filename");
export const displayStoreFolderInfo = createAction<string>(
  "display/store-folder-info"
);
