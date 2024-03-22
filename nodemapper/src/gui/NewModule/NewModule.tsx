import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React from 'react';

import ModuleCommands from './components/Commands';
import ModuleConfig from './components/Config';
import ModuleDocString from './components/DocString';
import ModuleEnvironment from './components/Environment';
import ModuleInputs from './components/InputFiles';
import ModuleNameAndRepo from './components/NameAndRepo';
import ModuleOutputs from './components/OutputFiles';
import ModulePayloadResources from './components/PayloadResources';
import ModulePayloadScripts from './components/PayloadScripts';
import { useAppDispatch } from 'redux/store/hooks';

import {
  newmoduleBuild,
  newmoduleValidate,
  newmoduleOpenModuleFolder,
} from 'redux/actions';

const Section = (props: any) => {
  return (
    <Grid item xs={8}>
      <Paper
        sx={{
          padding: 2,
          display: 'flex',
          flexDirection: 'column',
          rowGap: 1,
          width: '100%',
          ...props.style,
        }}
      >
        {props.children}
      </Paper>
    </Grid>
  );
};

const ModuleBuild = () => {
  const dispatch = useAppDispatch();

  const handleBuildClick = () => {
    dispatch(newmoduleBuild());
  };

  const handleValidateClick = () => {
    dispatch(newmoduleValidate());
  };

  const handleOpenModuleFolder = () => {
    dispatch(newmoduleOpenModuleFolder());
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Build
      </Typography>
      <Typography variant="body2" gutterBottom>
        Create the module by building it from the provided configuration.
      </Typography>
      <Divider />
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={1} alignItems="center" justifyContent="center">
          <Grid item>
            <Button
              variant="contained"
              onClick={handleBuildClick}
            >
              Build
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleValidateClick}
            >
              Validate
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleOpenModuleFolder}
            >
              Open module folder
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

const NewModule = () => {
  return (
    <Grid container spacing={1} alignItems="center" justifyContent="center">
      <Section style={{ flexDirection: 'row' }}>
        <ModuleNameAndRepo />
      </Section>
      <Section>
        <ModuleDocString />
      </Section>
      <Section>
        <ModuleConfig />
      </Section>
      <Section>
        <ModuleInputs />
      </Section>
      <Section>
        <ModuleOutputs />
      </Section>
      <Section>
        <ModuleCommands />
      </Section>
      <Section>
        <ModuleEnvironment />
      </Section>
      <Section>
        <ModulePayloadScripts />
      </Section>
      <Section>
        <ModulePayloadResources />
      </Section>
      <Section>
        <ModuleBuild />
      </Section>
    </Grid>
  );
};

export default NewModule;
