import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import {
  builderSetAutoValidateConnections,
  builderSetDisplayModuleSettings,
  builderSetPackageModulesInWorkflow,
  builderSetHideParamsInModuleInfo,
} from 'redux/actions';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';

const InterfaceOptions = () => {
  const dispatch = useAppDispatch();

  const display_module_settings = useAppSelector(
    (state) => state.builder.display_module_settings
  );
  const SetDisplayModuleSettings = (value: boolean) => {
    dispatch(builderSetDisplayModuleSettings(value));
    dispatch(builderSetHideParamsInModuleInfo(!value));
  }

  const hide_params_in_module_info = useAppSelector(
    (state) => state.builder.hide_params_in_module_info,
  );
  const SetHideParamsInModuleInfo = (value: boolean) =>
    dispatch(builderSetHideParamsInModuleInfo(value));

  const auto_validate_connections = useAppSelector(
    (state) => state.builder.auto_validate_connections,
  );
  const SetAutoValidateConnections = (value: boolean) =>
    dispatch(builderSetAutoValidateConnections(value));

  const package_modules_in_workflow = useAppSelector(
    (state) => state.builder.package_modules_in_workflow,
  );
  const SetPackageModulesInWorkflow = (value: boolean) =>
    dispatch(builderSetPackageModulesInWorkflow(value));

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
        <FormControlLabel
          control={
            <Checkbox
              id="package_modules_in_workflow"
              checked={package_modules_in_workflow}
              onChange={(e) => SetPackageModulesInWorkflow(e.target.checked)}
            />
          }
          label="Package all modules in workflow"
        />
      </FormGroup>
    </>
  );
};

export default InterfaceOptions;
