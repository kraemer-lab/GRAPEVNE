import React from 'react';

import { builderReadStoreConfig } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { ThemeOptions, ThemeProvider, createTheme } from '@mui/material/styles';

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
    },
  };
  const theme = createTheme(themeOptions);

  return (
    <ThemeProvider theme={theme}>
      <Navigation />;
    </ThemeProvider>
  );
}
export default App;
