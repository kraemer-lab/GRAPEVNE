import { combineReducers } from 'redux';
import builderReducer from './builder';
import displayReducer from './display';
import newmodule from './newmodule';
import runnerReducer from './runner';
import settings from './settings';

const rootReducer = combineReducers({
  runner: runnerReducer,
  builder: builderReducer,
  display: displayReducer,
  newmodule: newmodule,
  settings: settings,
});

export default rootReducer;
