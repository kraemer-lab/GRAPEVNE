import { combineReducers } from 'redux';
import builderReducer from './builder';
import newmodule from './newmodule';
import displayReducer from './display';
import runnerReducer from './runner';

const rootReducer = combineReducers({
  runner: runnerReducer,
  builder: builderReducer,
  display: displayReducer,
  newmodule: newmodule,
});

export default rootReducer;
