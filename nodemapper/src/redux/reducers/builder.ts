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
      .addCase(actions.builderCompileToJson, (state, action) => {
        console.info("[Reducer] (builder)compileToJson");
      })
      .addCase(actions.builderSubmitQuery, (state, action) => {
        state.query = action.payload
        console.info("[Reducer] (builder)SubmitQuery");
      })
  }
);

export default builderReducer
