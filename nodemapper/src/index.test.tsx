import React from 'react'
import { render, screen } from "@testing-library/react";
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './redux/store'

import App from "./gui/App"

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});

test('code quality', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
});
