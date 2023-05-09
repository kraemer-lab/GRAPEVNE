import { createReducer } from "@reduxjs/toolkit"
import * as actions from "../actions"

// State
const builderStateInit = {
  query: {},
  modules_list: '[]',
};

// Nodemap
const builderReducer = createReducer(
  builderStateInit,
  (builder) => {
    builder
      .addCase(actions.builderLoadNodemap, (state, action) => {
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.builderSaveNodemap, (state, action) => {
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.builderCompileToJson, (state, action) => {
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.builderSubmitQuery, (state, action) => {
        state.query = action.payload
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.builderNodeSelected, (state, action) => {
        // Action intercepted in middleware to control display
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.builderNodeDeselected, (state, action) => {
        // Action intercepted in middleware to control display
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.builderGetRemoteModules, (state, action) => {
        // Get list of remote actions
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.builderUpdateModulesList, (state, action) => {
        // Get list of remote actions
        state.modules_list = JSON.stringify(action.payload);
        console.info("[Reducer] " + action.type);
      })
  }
);

export default builderReducer
