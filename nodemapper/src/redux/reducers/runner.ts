import { createReducer } from "@reduxjs/toolkit"
import * as actions from "../actions"

// State
const runnerStateInit = {
  serialize: '',
  linter: '',
  jobstatus: '',
  jobstatus_update: false,  // should we poll for updates?
  query: {},
};

// Nodemap
const runnerReducer = createReducer(
  runnerStateInit,
  (builder) => {
    builder
      .addCase(actions.runnerAddNode, (state, action) => {
        // Business logic
        console.info("[Reducer] (runner)AddNode");
      })
      .addCase(actions.runnerNodeSelected, (state, action) => {
        // Action intercepted in middleware to control display
        console.info("[Reducer] (runner)NodeSelected", state, action);
      })
      .addCase(actions.runnerNodeDeselected, (state, action) => {
        // Action intercepted in middleware to control display
        console.info("[Reducer] (runner)NodeDeselected");
      })
      .addCase(actions.runnerSelectNone, (state, action) => {
        // Business logic
        console.info("[Reducer] (runner)SelectNone");
      })
      .addCase(actions.runnerSubmitQuery, (state, action) => {
        state.query = action.payload
        console.info("[Reducer] (runner)SubmitQuery");
      })
      .addCase(actions.runnerImportSnakefile, (state, action) => {
        console.info("[Reducer] (runner)ImportSnakefile");
      })
      .addCase(actions.runnerLoadSnakefile, (state, action) => {
        console.info("[Reducer] (runner)LoadSnakefile");
      })
      .addCase(actions.runnerBuildSnakefile, (state, action) => {
        console.info("[Reducer] (runner)BuildSnakefile");
      })
      .addCase(actions.runnerLintSnakefile, (state, action) => {
        console.info("[Reducer] (runner)LintSnakefile");
      })
      .addCase(actions.runnerStoreLint, (state, action) => {
        state.linter = action.payload
        console.info("[Reducer] (runner)StoreLint");
      })
      .addCase(actions.runnerStoreMap, (state, action) => {
        state.serialize = action.payload
        console.info("[Reducer] (runner)StoreMap");
      })
      .addCase(actions.runnerStoreJobStatus, (state, action) => {
        state.jobstatus = action.payload
        console.info("[Reducer] (runner)StoreJobStatus");
      })
      .addCase(actions.runnerLoadWorkflow, (state, action) => {
        console.info("[Reducer] (runner)LoadWorkflow");
      })
  }
);

export default runnerReducer
