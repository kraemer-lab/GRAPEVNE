import React from 'react';
import RepoOptions from './RepoOptions';

import { useEffect } from 'react';
import {
  builderSelectSnakemakeBackend,
  builderSetAutoValidateConnections,
  builderSetDisplayModuleSettings,
  builderSetEnvironmentVars,
  builderSetPackageModulesInWorkflow,
  builderSetSnakemakeArgs,
  builderWriteStoreConfig,
} from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Input from "@mui/material/Input";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import Typography from "@mui/material/Typography";
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';

const default_input_size = 35;
const panel_background_color = '#2e3746';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  margin: '5px 10px',
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const BuilderSettings = () => {
  const dispatch = useAppDispatch();

  const onComponentMount = () => {
    return;
  };
  const onComponentUnmount = () => {
    dispatch(builderWriteStoreConfig());
  };
  useEffect(() => {
    onComponentMount();
    return () => onComponentUnmount();
  }, []);

  const snakemake_backend = useAppSelector((state) => state.builder.snakemake_backend);
  const snakemake_args = useAppSelector((state) => state.builder.snakemake_args);
  const environment_vars = useAppSelector((state) => state.builder.environment_variables);
  const display_module_settings = useAppSelector((state) => state.builder.display_module_settings);
  const auto_validate_connections = useAppSelector(
    (state) => state.builder.auto_validate_connections,
  );
  const package_modules_in_workflow = useAppSelector(
    (state) => state.builder.package_modules_in_workflow,
  );

  const SetSnakemakeArgs = (args: string) => dispatch(builderSetSnakemakeArgs(args));

  const SetEnvironmentVars = (args: string) => dispatch(builderSetEnvironmentVars(args));

  const selectSnakemakeBackend = (value: string) => dispatch(builderSelectSnakemakeBackend(value));

  const SetDisplayModuleSettings = (value: boolean) =>
    dispatch(builderSetDisplayModuleSettings(value));

  const SetAutoValidateConnections = (value: boolean) =>
    dispatch(builderSetAutoValidateConnections(value));

  const SetPackageModulesInWorkflow = (value: boolean) =>
    dispatch(builderSetPackageModulesInWorkflow(value));

  const SnakemakeOptions = () => {
    return (
      <>
        <Typography variant="h6">Snakemake</Typography>
        <Typography variant="body1" align='left'>Backend</Typography>
        <p>
          <Select
            defaultValue={snakemake_backend}
            onChange={(e) => selectSnakemakeBackend(e.target.value)}
            style={{ width: "100%" }}
            size="small"
          >
            <MenuItem value="builtin">Built-in</MenuItem>
            <MenuItem value="system">System</MenuItem>
          </Select>
        </p>
        <Typography variant="body1" align='left'>Arguments</Typography>
        <p>
          <TextField
            id="inputBuilderSettingsSnakemakeArgs"
            type="text"
            value={snakemake_args}
            onChange={(e) => SetSnakemakeArgs(e.target.value)}
            style={{ width: "100%" }}
            size="small"
          />
        </p>
      </>
    );
  };

  const EnvironmentOptions = () => {
    return (
      <>
        <Typography variant="h6">Environment</Typography>
        <Typography variant="body1" align='left'>Variables</Typography>
        <TextField
          id="inputBuilderSettingsEnvironmentVars"
          type="text"
          value={environment_vars}
          onChange={(e) => SetEnvironmentVars(e.target.value)}
          style={{ width: "100%" }}
          size="small"
        />
      </>
    );
  };

  const InterfaceOptions = () => {
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
                onChange={(e) =>
                  SetPackageModulesInWorkflow(e.target.checked)
                }
              />
            }
            label="Package all modules in workflow"
          />
        </FormGroup>
      </>
    );
  };

  return (
    <Box
      sx={{
          mb: 2,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          overflowY: "scroll",
      }}
    >
      <Grid
        container
        spacing={0}
        alignItems="center"
        justifyContent="center"
      >
        <Grid item xs={8}>
          <Item>
            <RepoOptions />
          </Item>
        </Grid>
        <Grid item xs={8}>
          <Item>
            <SnakemakeOptions />
          </Item>
        </Grid>
        <Grid item xs={8}>
          <Item>
            <EnvironmentOptions />
          </Item>
        </Grid>
        <Grid item xs={8}>
          <Item>
            <InterfaceOptions />
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BuilderSettings;
