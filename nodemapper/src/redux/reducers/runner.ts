import { createReducer } from "@reduxjs/toolkit"
import * as actions from "../actions"

// State
const runnerStateInit = {
  serialize: '',
  linter: '',
  jobstatus: '',
  jobstatus_update: false,  // should we poll for updates?
  query: {},
  statustext: '',
};

// Nodemap
const runnerReducer = createReducer(
  runnerStateInit,
  (builder) => {
    builder
      .addCase(actions.runnerAddNode, (state, action) => {
        // Business logic
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerNodeSelected, (state, action) => {
        // Action intercepted in middleware to control display
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerNodeDeselected, (state, action) => {
        // Action intercepted in middleware to control display
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerSelectNone, (state, action) => {
        // Business logic
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerSubmitQuery, (state, action) => {
        state.query = action.payload
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerImportSnakefile, (state, action) => {
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerLoadSnakefile, (state, action) => {
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerBuildSnakefile, (state, action) => {
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerLintSnakefile, (state, action) => {
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerStoreLint, (state, action) => {
        state.linter = action.payload
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerStoreMap, (state, action) => {
        state.serialize = action.payload
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerStoreJobStatus, (state, action) => {
        state.jobstatus = action.payload
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerLoadWorkflow, (state, action) => {
        console.info("[Reducer] " + action.type);
      })
      .addCase(actions.runnerUpdateStatusText, (state, action) => {
        state.statustext = action.payload
        console.info("[Reducer] " + action.type);
      })
  }
);

export default runnerReducer
