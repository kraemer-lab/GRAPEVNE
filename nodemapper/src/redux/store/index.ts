import { configureStore } from '@reduxjs/toolkit';
import { builderMiddleware } from 'redux/middleware/builder';
import { displayMiddleware } from 'redux/middleware/display';
import { newmoduleMiddleware } from 'redux/middleware/newmodule';
import { runnerMiddleware } from 'redux/middleware/runner';
import rootReducer from 'redux/reducers';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(runnerMiddleware)
      .concat(builderMiddleware)
      .concat(displayMiddleware)
      .concat(newmoduleMiddleware),
  //window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
