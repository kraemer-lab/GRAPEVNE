import * as actions from '../actions';
import {
  INewModuleStateConfig,
  INewModuleState,
} from 'types';
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
  },

  // Build settings
  build: {
    overwrite_existing_module_folder: false,
    as_zip: false,
  },
};

const newmoduleReducer = createReducer(newmoduleStateInit, (builder) => {
  builder
    .addCase(actions.newmoduleUpdateConfig, (state, action) => {
      state.config = action.payload as INewModuleStateConfig;
      console.info('[Reducer] ' + action.type);
    })
    .addCase(actions.newmoduleEnvCondaSearchUpdatePackageList, (state, action) => {
      state.env.packagelist = action.payload;
      console.info('[Reducer] ' + action.type);
    });
});

export default newmoduleReducer;
