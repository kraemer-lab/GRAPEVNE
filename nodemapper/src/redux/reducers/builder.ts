import { createReducer } from "@reduxjs/toolkit"
import * as actions from "../actions"

// State
const builderStateInit = {
  query: {},
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
  }
);

export default builderReducer
