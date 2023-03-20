import { configureStore } from '@reduxjs/toolkit'
import { nodemapMiddleware } from '../middleware/nodemap'
import { displayMiddleware } from '../middleware/display'
import rootReducer from '../reducers'

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
    .concat(nodemapMiddleware)
    .concat(displayMiddleware)
  ,
  //window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
