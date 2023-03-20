import { createReducer } from "@reduxjs/toolkit"
import * as action from "../actions"

const displayStateInit = {
  graph_is_moveable: false,
  show_settings_panel: false,
  nodeinfo: "",
};

// Display
const displayReducer = createReducer(
  displayStateInit,
  (builder) => {
    builder
	  .addCase(action.displayOpenSettings, (state, action) => {
	    state.show_settings_panel = true;
	    console.info("[Reducer] (display)OpenSettings", state, action);
      })
      .addCase(action.displayCloseSettings, (state, action) => {
        state.show_settings_panel = false;
	    console.info("[Reducer] (display)CloseSettings", state, action);
      })
      .addCase(action.displayToggleSettingsVisibility, (state, action) => {
        state.show_settings_panel = !state.show_settings_panel;
	    console.info("[Reducer] (display)ToggleSettingsVisibility", state, action);
      })
      .addCase(action.displayUpdateNodeInfo, (state, action) => {
		state.nodeinfo = action.payload
	    console.info("[Reducer] (display)UpdateCodeSnippet", state, action);
      })
      .addCase(action.displaySaveCodeSnippet, (state, action) => {
		// TODO: Update codesnippet in node
	    console.info("[Reducer] (display)UpdateCodeSnippet", state, action);
      })
      .addCase(action.displayToggleGraphMoveable, (state, action) => {
		console.log("Pre change: ", state.graph_is_moveable)
		state.graph_is_moveable = !state.graph_is_moveable;
		console.log("Post change: ", state.graph_is_moveable)
	    console.info("[Reducer] (display)ToggleGraphMoveable", state, action);
      })
  }
);

export default displayReducer
