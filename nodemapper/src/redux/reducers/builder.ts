import { createReducer } from "@reduxjs/toolkit"
import * as actions from "../actions"

// State
const builderStateInit = {
};

// Nodemap
const builderReducer = createReducer(
  builderStateInit,
  (builder) => {
    builder
      .addCase(actions.builderCompileToJson, (state, action) => {
        console.info("[Reducer] (builder)compileToJson");
      })
  }
);

export default builderReducer
