import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import {
  settingsSetAutoValidateConnections,
  settingsSetDisplayModuleSettings,
  settingsSetEdgeType,
  settingsSetHideParamsInModuleInfo,
  settingsSetLayoutDirection,
  settingsSetSnapToGrid,
} from 'redux/actions';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import SelectItem from './components/SelectItem';

const InterfaceOptions: React.FC<{ labelWidth: string }> = ({ labelWidth }) => {
  const dispatch = useAppDispatch();

  const display_snap_to_grid = useAppSelector((state) => state.settings.snap_to_grid);
  const SetDisplaySnapToGrid = (value: boolean) => {
    dispatch(settingsSetSnapToGrid(value));
  };

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

  const layout_direction = useAppSelector((state) => state.settings.layout_direction);
  const setLayoutDirection = (value: string) => {
    dispatch(settingsSetLayoutDirection(value));
  };

  const edge_type = useAppSelector((state) => state.settings.edge_type);
  const setEdgeType = (value: string) => {
    dispatch(settingsSetEdgeType(value));
  };

  return (
    <>
      <Typography variant="h6">Interface</Typography>
      <SelectItem
        id="settings_interface_layout_direction"
        label="Layout:"
        value={layout_direction}
        list={[
          { label: 'Left-to-right', value: 'LR' },
          { label: 'Top-down', value: 'TD' },
        ]}
        onChange={(e) => setLayoutDirection(e.target.value)}
        labelWidth={labelWidth}
      />
      <SelectItem
        id="settings_interface_edge_type"
        label="Connectors:"
        value={edge_type}
        list={[
          { label: 'Bezier', value: 'bezier' },
          { label: 'Smooth-step', value: 'smoothstep' },
          { label: 'Straight', value: 'straight' },
        ]}
        onChange={(e) => setEdgeType(e.target.value)}
        labelWidth={labelWidth}
      />
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              id="display_snap_to_grid"
              checked={display_snap_to_grid}
              onChange={(e) => SetDisplaySnapToGrid(e.target.checked)}
            />
          }
          label="Snap to grid"
        />
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
