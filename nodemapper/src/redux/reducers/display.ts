import { createReducer } from "@reduxjs/toolkit"
import * as action from "../actions"

const displayStateInit = {
  graph_is_moveable: false,
  show_settings_panel: false,
  nodeinfo: "",
  filename: "",
  folderinfo: '{"foldername": ".", "contents": []}',
};

// Display
const displayReducer = createReducer(
  displayStateInit,
  (builder) => {
    builder
      .addCase(action.displayOpenSettings, (state, action) => {
        state.show_settings_panel = true;
        console.debug("[Reducer] (display)OpenSettings", state, action);
      })
      .addCase(action.displayCloseSettings, (state, action) => {
        state.show_settings_panel = false;
        console.debug("[Reducer] (display)CloseSettings", state, action);
      })
      .addCase(action.displayToggleSettingsVisibility, (state, action) => {
        state.show_settings_panel = !state.show_settings_panel;
        console.debug("[Reducer] (display)ToggleSettingsVisibility", state, action);
      })
      .addCase(action.displayUpdateNodeInfo, (state, action) => {
        state.nodeinfo = action.payload
        console.debug("[Reducer] (display)UpdateCodeSnippet", state, action);
      })
      .addCase(action.displaySaveCodeSnippet, (state, action) => {
        // TODO: Update codesnippet in node
        console.info("[Reducer] (display)UpdateCodeSnippet", state, action);
      })
      .addCase(action.displayStoreFolderInfo, (state, action) => {
        state.folderinfo = action.payload
        console.info("[Reducer] (display)StoreFolderInfo", state, action);
      })
      .addCase(action.displaySetFolder, (state, action) => {
        state.folderinfo = '{"foldername": "' + action.payload + '",  "contents": []}'
        console.info("[Reducer] (display)SetFolder", state, action);
      })
      .addCase(action.displaySetFilename, (state, action) => {
        state.filename = action.payload
        console.info("[Reducer] (display)SetFilename", state, action);
      })
  }
);

export default displayReducer
