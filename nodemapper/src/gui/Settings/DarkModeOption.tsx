import { FormControl, FormControlLabel, FormGroup, Switch } from '@mui/material';
import React from 'react';
import { settingsToggleDarkMode } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const DarkModeOption = () => {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.settings.dark_mode);
  const handleToggleDarkMode = () => {
    dispatch(settingsToggleDarkMode());
  };

  return (
    <FormControl>
      <FormGroup>
        <FormControlLabel
          control={<Switch checked={darkMode} onChange={handleToggleDarkMode} name="darkMode" />}
          label="Dark Mode"
        />
      </FormGroup>
    </FormControl>
  );
};

export default DarkModeOption;
