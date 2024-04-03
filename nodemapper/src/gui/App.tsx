import React from 'react';

import { ThemeOptions, ThemeProvider, createTheme } from '@mui/material/styles';
import { ErrorBoundary } from 'react-error-boundary';
import { builderReadStoreConfig } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { errorHandler } from './ErrorHandling/Error';

import Navigation from './Navigation';

// Startup
let started = false;
const startup = () => {
  started = true;
  const dispatch = useAppDispatch();
  dispatch(builderReadStoreConfig());
};

const App = () => {
  if (!started) startup();
  const dark_mode = useAppSelector((state) => state.builder.dark_mode);

  const themeOptions: ThemeOptions = {
    palette: {
      mode: dark_mode ? 'dark' : 'light',
      primary: {
        main: '#0E7569',
      },
      secondary: {
        main: '#ecf3f0',
      },
    },
    // Prevent MUI-backdrop from obstructing screen
    // https://github.com/mui/material-ui/issues/32286
    components: {
      MuiBackdrop: {
        styleOverrides: {
          root: {
            '&[style*="opacity: 0"]': {
              pointerEvents: 'none',
            },
          },
        },
      },
    },
  };
  const theme = createTheme(themeOptions);

  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary
        fallbackRender={errorHandler}
        onReset={(details) => {
          console.log('reset', details);
        }}
      >
        <Navigation />
      </ErrorBoundary>
    </ThemeProvider>
  );
};
export default App;
