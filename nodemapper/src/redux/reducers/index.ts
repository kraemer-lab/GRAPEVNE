import { combineReducers } from 'redux';
import builderReducer from './builder';
import displayReducer from './display';
import runnerReducer from './runner';

const rootReducer = combineReducers({
  runner: runnerReducer,
  builder: builderReducer,
  display: displayReducer,
});

export default rootReducer;
