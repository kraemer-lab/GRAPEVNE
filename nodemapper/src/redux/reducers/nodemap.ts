import { createReducer } from "@reduxjs/toolkit"
import * as action from "../actions"

// State
const nodemapStateInit = {
  serialize: '',
  query: {}  // temp location
};

// Nodemap
const nodemapReducer = createReducer(
  nodemapStateInit,
  (builder) => {
    builder
      .addCase(action.nodemapAddNode, (state, action) => {
        // Business logic
	    console.info("[Reducer] (nodemap)AddNode");
      })
	  .addCase(action.nodemapNodeSelected, (state, action) => {
        // Action intercepted in middleware to control display
	    console.info("[Reducer] (nodemap)NodeSelected", state, action);
      })
	  .addCase(action.nodemapNodeDeselected, (state, action) => {
        // Action intercepted in middleware to control display
	    console.info("[Reducer] (nodemap)NodeDeselected");
      })
	  .addCase(action.nodemapSelectNone, (state, action) => {
	    // Business logic
	    console.info("[Reducer] (nodemap)SelectNone");
      })
	  .addCase(action.nodemapSubmitQuery, (state, action) => {
		state.query = action.payload
	    console.info("[Reducer] (nodemap)SubmitQuery");
      })
	  .addCase(action.nodemapImportSnakefile, (state, action) => {
	    console.info("[Reducer] (nodemap)ImportSnakefile");
      })
	  .addCase(action.nodemapBuildSnakefile, (state, action) => {
	    console.info("[Reducer] (nodemap)BuildSnakefile");
      })
	  .addCase(action.nodemapStoreMap, (state, action) => {
	    state.serialize = action.payload
	    console.info("[Reducer] (nodemap)StoreMap");
      })
  }
);

export default nodemapReducer
