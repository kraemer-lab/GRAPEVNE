import React from "react";
import store from "./redux/store";

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import { StrictMode } from "react";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import App from "./gui/App";
import "./root.css";

/**
 * Entry point for the application
 **/
const root = createRoot(document.getElementById("app"));
root.render(
  <Provider store={store}>
    <HashRouter>
      <StrictMode>
        <App />
      </StrictMode>
    </HashRouter>
  </Provider>,
);
