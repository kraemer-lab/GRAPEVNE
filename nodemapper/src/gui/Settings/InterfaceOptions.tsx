import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import {
  builderSetAutoValidateConnections,
  builderSetDisplayModuleSettings,
  builderSetPackageModulesInWorkflow,
} from 'redux/actions';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';

const InterfaceOptions = () => {
  const dispatch = useAppDispatch();

  const display_module_settings = useAppSelector((state) => state.builder.display_module_settings);
  const auto_validate_connections = useAppSelector(
    (state) => state.builder.auto_validate_connections,
  );
  const package_modules_in_workflow = useAppSelector(
    (state) => state.builder.package_modules_in_workflow,
  );

  const SetDisplayModuleSettings = (value: boolean) =>
    dispatch(builderSetDisplayModuleSettings(value));

  const SetAutoValidateConnections = (value: boolean) =>
    dispatch(builderSetAutoValidateConnections(value));

  const SetPackageModulesInWorkflow = (value: boolean) =>
    dispatch(builderSetPackageModulesInWorkflow(value));

  return (
    <>
      <Typography variant="h6">Interface</Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={display_module_settings}
              onChange={(e) => SetDisplayModuleSettings(e.target.checked)}
            />
          }
          label="Display module settings"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={auto_validate_connections}
              onChange={(e) => SetAutoValidateConnections(e.target.checked)}
            />
          }
          label="Auto-validate connections"
        />
        <FormControlLabel
          control={
            <Checkbox
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
