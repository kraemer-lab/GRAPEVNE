import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import {
  settingsSetAutoValidateConnections,
  settingsSetDisplayModuleSettings,
  settingsSetHideParamsInModuleInfo,
} from 'redux/actions';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';

const InterfaceOptions = () => {
  const dispatch = useAppDispatch();

  const display_module_settings = useAppSelector((state) => state.settings.display_module_settings);
  const SetDisplayModuleSettings = (value: boolean) => {
    dispatch(settingsSetDisplayModuleSettings(value));
    dispatch(settingsSetHideParamsInModuleInfo(!value));
  };

  const hide_params_in_module_info = useAppSelector(
    (state) => state.settings.hide_params_in_module_info,
  );
  const SetHideParamsInModuleInfo = (value: boolean) =>
    dispatch(settingsSetHideParamsInModuleInfo(value));

  const auto_validate_connections = useAppSelector(
    (state) => state.settings.auto_validate_connections,
  );
  const SetAutoValidateConnections = (value: boolean) =>
    dispatch(settingsSetAutoValidateConnections(value));

  return (
    <>
      <Typography variant="h6">Interface</Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              id="display_module_settings"
              checked={display_module_settings}
              onChange={(e) => SetDisplayModuleSettings(e.target.checked)}
            />
          }
          label="Display full module configuration"
        />
        <FormControlLabel
          control={
            <Checkbox
              id="hide_params_in_module_info"
              disabled={display_module_settings}
              checked={hide_params_in_module_info}
              onChange={(e) => SetHideParamsInModuleInfo(e.target.checked)}
            />
          }
          label="Hide 'params' in module configuration"
        />
        <FormControlLabel
          control={
            <Checkbox
              id="auto_validate_connections"
              checked={auto_validate_connections}
              onChange={(e) => SetAutoValidateConnections(e.target.checked)}
            />
          }
          label="Auto-validate connections"
        />
      </FormGroup>
    </>
  );
};

export default InterfaceOptions;
