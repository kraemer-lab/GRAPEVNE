import * as actions from '../actions';

import { createReducer } from '@reduxjs/toolkit';

export interface INewModuleStateConfig {
  name: string;
  repo: string;
  docstring: string;
  ports: string[];
  params: string;
  command_directive: string;
  command: string;
}

export interface INewModuleState {
  config: INewModuleStateConfig;
}

const default_docstring = `Provide a short (one-line) description of the module.

Then provide a longer description which can cover several lines or paragraphs, including links to any websites that may be relevant.

Params:
  param1 (str): Provide a description of any parameters that may be used by the module.`;

// State
const newmoduleStateInit: INewModuleState = {
  config: {
    name: '',
    repo: '',
    docstring: default_docstring,
    ports: ['in'],
    params: '',
    command_directive: 'shell',
    command: '',
  },
};

const newmoduleReducer = createReducer(newmoduleStateInit, (builder) => {
  builder
    .addCase(actions.newmoduleUpdateConfig, (state, action) => {
      state.config = action.payload as INewModuleStateConfig;
      console.info('[Reducer] ' + action.type);
    });
});

export default newmoduleReducer;
