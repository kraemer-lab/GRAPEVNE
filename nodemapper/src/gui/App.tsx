import React from 'react';

import { ThemeOptions, ThemeProvider, createTheme } from '@mui/material/styles';
import { builderReadStoreConfig } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

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
  };
  const theme = createTheme(themeOptions);

  return (
    <ThemeProvider theme={theme}>
      <Navigation />
    </ThemeProvider>
  );
};
export default App;
