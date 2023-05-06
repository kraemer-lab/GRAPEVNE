import React from 'react'
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './redux/store'

import App from "./gui/App"

test('code quality', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
});
