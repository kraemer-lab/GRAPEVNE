import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import React from 'react';

import ModuleCommands from './components/Commands';
import ModuleConfig from './components/Config';
import ModuleDocString from './components/DocString';
import ModuleEnvironment from './components/Environment';
import ModuleInputs from './components/InputFiles';
import ModuleBuild from './components/ModuleBuild';
import ModuleNameAndRepo from './components/NameAndRepo';
import ModuleOutputs from './components/OutputFiles';
import ModulePayloadResources from './components/PayloadResources';
import ModulePayloadScripts from './components/PayloadScripts';

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
