import React from 'react';
import store from './redux/store';

import { StrictMode } from 'react';
import { Provider } from 'react-redux';

import { render } from '@testing-library/react';

import App from './gui/App';

// Polyfill ResizeObserver which otherwise throws an error in tests
import * as polyfill from 'resize-observer-polyfill';
global.ResizeObserver = polyfill.default;

test('code quality', () => {
  render(
    <Provider store={store}>
      <StrictMode>
        <App />
      </StrictMode>
    </Provider>,
  );
});
