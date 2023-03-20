import nodemapReducer from './nodemap'
import displayReducer from './display'
import { combineReducers } from 'redux'

const rootReducer = combineReducers({
  nodemap: nodemapReducer,
  display: displayReducer,
})

export default rootReducer;
