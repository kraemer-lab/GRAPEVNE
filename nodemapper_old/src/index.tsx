import React from "react";
import store from "./redux/store";

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "./gui/App";
import "./root.css";

/**
 * Entry point for the application
 **/
const root = createRoot(document.getElementById("app"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
