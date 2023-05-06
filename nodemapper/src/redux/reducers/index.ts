import nodemapReducer from './nodemap'
import builderReducer from './builder'
import displayReducer from './display'
import { combineReducers } from 'redux'

const rootReducer = combineReducers({
  nodemap: nodemapReducer,
  builder: builderReducer,
  display: displayReducer,
})

export default rootReducer;
