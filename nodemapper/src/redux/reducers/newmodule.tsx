import { INewModuleResult, INewModuleState, INewModuleStateConfig, INewModuleStateEnv } from 'types';
import * as actions from '../actions';
export * from 'types';

import { createReducer } from '@reduxjs/toolkit';

const default_docstring = `Provide a short (one-line) description of the module.

Then provide a longer description which can cover several lines or paragraphs, including links to any websites that may be relevant.

Params:
  param1 (str): Provide a description of any parameters that may be used by the module.`;

// State
const newmoduleStateInit: INewModuleState = {
  // New module configuration
  config: {
    name: '',
    foldername: '',
    repo: '',
    project: '',
    docstring: default_docstring,
    ports: ['in'],
    params: '',
    input_files: [],
    output_files: [],
    env: '',
    scripts: [],
    resources: [],
    command_directive: 'shell',
    command: '',
  },

  // Environment-specific options
  env: {
    // Conda search results
    condasearch: {},
    packagelist: [],
    channels: [],
    searching: false,
  },

  // Build settings
  build: {
    overwrite_existing_module_folder: false,
    as_zip: false,
  },

  // Build results
  result: {
    folder: '',
    building: false,
  },
};

const newmoduleReducer = createReducer(newmoduleStateInit, (builder) => {
  builder
    .addCase(actions.newmoduleClear, (state) => {
      for (const key in state) {
        state[key] = newmoduleStateInit[key];
      }
      console.info('[Reducer] ' + actions.newmoduleClear.type);
    })
    .addCase(actions.newmoduleUpdateConfig, (state, action) => {
      state.config = action.payload as INewModuleStateConfig;
      if (state.config.repo === 'Zip file') state.build.as_zip = true;
      else state.build.as_zip = false;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.newmoduleUpdateResult, (state, action) => {
      state.result = { ...state.result, ...(action.payload as INewModuleResult) };
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.newmoduleUpdateEnv, (state, action) => {
      state.env = { ...state.env, ...(action.payload as INewModuleStateEnv) };
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.newmoduleUpdateEnvCondaSearchChannels, (state, action) => {
      state.env.channels = action.payload;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.newmoduleEnvCondaSearch, (state) => {
      state.env.searching = true;
      console.info('[Reducer] ' + actions.newmoduleEnvCondaSearch.type);
    })
    .addCase(actions.newmoduleEnvCondaSearchUpdatePackageList, (state, action) => {
      state.env.packagelist = action.payload;
      state.env.searching = false;
      console.info('[Reducer] ' + action.type);
    });
});

export default newmoduleReducer;
