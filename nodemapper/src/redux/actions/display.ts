import { createAction } from '@reduxjs/toolkit';

export const displayGetFolderInfo = createAction('display/get-folder-info');
export const displayUpdateNodeInfo = createAction<string>('display/update-node-info');
export const displaySaveNodeparams = createAction<string>('display/save-nodeparams');
export const displaySetFolder = createAction<string>('display/set-folder');
export const displaySetFilename = createAction<string>('display/set-filename');
export const displayStoreFolderInfo = createAction<string>('display/store-folder-info');
