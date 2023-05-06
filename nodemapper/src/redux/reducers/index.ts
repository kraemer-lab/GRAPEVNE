import runnerReducer from './runner'
import builderReducer from './builder'
import displayReducer from './display'
import { combineReducers } from 'redux'

const rootReducer = combineReducers({
  runner: runnerReducer,
  builder: builderReducer,
  display: displayReducer,
})

export default rootReducer;
