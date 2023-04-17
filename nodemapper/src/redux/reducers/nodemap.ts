import { createReducer } from "@reduxjs/toolkit"
import * as actions from "../actions"

// State
const nodemapStateInit = {
  serialize: '',
  linter: '',
  jobstatus: '',
  jobstatus_update: false,  // should we poll for updates?
  query: {},  // temp location
};

// Nodemap
const nodemapReducer = createReducer(
  nodemapStateInit,
  (builder) => {
    builder
      .addCase(actions.nodemapAddNode, (state, action) => {
        // Business logic
        console.info("[Reducer] (nodemap)AddNode");
      })
      .addCase(actions.nodemapNodeSelected, (state, action) => {
        // Action intercepted in middleware to control display
        console.info("[Reducer] (nodemap)NodeSelected", state, action);
      })
      .addCase(actions.nodemapNodeDeselected, (state, action) => {
        // Action intercepted in middleware to control display
        console.info("[Reducer] (nodemap)NodeDeselected");
      })
      .addCase(actions.nodemapSelectNone, (state, action) => {
        // Business logic
        console.info("[Reducer] (nodemap)SelectNone");
      })
      .addCase(actions.nodemapSubmitQuery, (state, action) => {
        state.query = action.payload
        console.info("[Reducer] (nodemap)SubmitQuery");
      })
      .addCase(actions.nodemapImportSnakefile, (state, action) => {
        console.info("[Reducer] (nodemap)ImportSnakefile");
      })
      .addCase(actions.nodemapLoadSnakefile, (state, action) => {
        console.info("[Reducer] (nodemap)LoadSnakefile");
      })
      .addCase(actions.nodemapBuildSnakefile, (state, action) => {
        console.info("[Reducer] (nodemap)BuildSnakefile");
      })
      .addCase(actions.nodemapLintSnakefile, (state, action) => {
        console.info("[Reducer] (nodemap)LintSnakefile");
      })
      .addCase(actions.nodemapStoreLint, (state, action) => {
        state.linter = action.payload
        console.info("[Reducer] (nodemap)StoreLint");
      })
      .addCase(actions.nodemapStoreMap, (state, action) => {
        state.serialize = action.payload
        console.info("[Reducer] (nodemap)StoreMap");
      })
      .addCase(actions.nodemapStoreJobStatus, (state, action) => {
        state.jobstatus = action.payload
        console.info("[Reducer] (nodemap)StoreJobStatus");
      })
      .addCase(actions.nodemapLoadWorkflow, (state, action) => {
        console.info("[Reducer] (nodemap)LoadWorkflow");
      })
  }
);

export default nodemapReducer
