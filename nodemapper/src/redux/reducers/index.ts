import { combineReducers } from 'redux';
import builderReducer, { IBuilderState } from './builder';
import displayReducer, { IDisplayState } from './display';
import newmodule, { INewModuleState } from './newmodule';
import runnerReducer, { IRunnerState } from './runner';
import settings, { ISettingsState } from './settings';

const rootReducer = combineReducers({
  runner: runnerReducer,
  builder: builderReducer,
  display: displayReducer,
  newmodule: newmodule,
  settings: settings,
});

export interface IState {
  runner: IRunnerState;
  builder: IBuilderState;
  display: IDisplayState;
  newmodule: INewModuleState;
  settings: ISettingsState;
}

export default rootReducer;
