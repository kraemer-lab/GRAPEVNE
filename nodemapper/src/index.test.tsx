import React from "react";
import store from "./redux/store";

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import { StrictMode } from "react";

import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";

import App from "./gui/App";
import "./root.css";

test("code quality", () => {
  render(
    <Provider store={store}>
      <HashRouter>
        <StrictMode>
          <App />
        </StrictMode>
      </HashRouter>
    </Provider>
  );
});
