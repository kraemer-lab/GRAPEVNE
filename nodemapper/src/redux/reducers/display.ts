import { createReducer } from "@reduxjs/toolkit"
import * as action from "../actions"

const displayStateInit = {
  graph_is_moveable: false,
  show_settings_panel: false,
  nodeinfo: "",
  filename: "",
  folderinfo: '{"foldername": ".", "contents": []}',
  statustext: "",
};

// Display
const displayReducer = createReducer(
  displayStateInit,
  (builder) => {
    builder
      .addCase(action.displayOpenSettings, (state, action) => {
        state.show_settings_panel = true;
        console.info("[Reducer] " + action.type);
      })
      .addCase(action.displayCloseSettings, (state, action) => {
        state.show_settings_panel = false;
        console.info("[Reducer] " + action.type);
      })
      .addCase(action.displayToggleSettingsVisibility, (state, action) => {
        state.show_settings_panel = !state.show_settings_panel;
        console.info("[Reducer] " + action.type);
      })
      .addCase(action.displayUpdateNodeInfo, (state, action) => {
        state.nodeinfo = action.payload
        console.info("[Reducer] " + action.type);
      })
      .addCase(action.displaySaveCodeSnippet, (state, action) => {
        // TODO: Update codesnippet in node
        console.info("[Reducer] " + action.type);
      })
      .addCase(action.displayStoreFolderInfo, (state, action) => {
        state.folderinfo = action.payload
        console.info("[Reducer] " + action.type);
      })
      .addCase(action.displaySetFolder, (state, action) => {
        state.folderinfo = '{"foldername": "' + action.payload + '",  "contents": []}'
        console.info("[Reducer] " + action.type);
      })
      .addCase(action.displaySetFilename, (state, action) => {
        state.filename = action.payload
        console.info("[Reducer] " + action.type);
      })
  }
);

export default displayReducer
