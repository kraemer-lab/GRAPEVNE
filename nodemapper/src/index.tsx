import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './redux/store'

import App from "./gui/App"

/**
 * Entry point for the application
 **/
const root = createRoot(document.getElementById("app"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
