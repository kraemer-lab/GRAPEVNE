import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Grid from '@mui/material/GridLegacy';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React from 'react';

import ModuleCommands from './components/Commands';
import ModuleDocString from './components/DocString';
import ModuleEnvironment from './components/Environment';
import ModuleInputs from './components/Inputs';
import ModuleBuild from './components/ModuleBuild';
import ModuleNameAndRepo from './components/NameAndRepo';
import ModuleOutputs from './components/OutputFiles';
import ModuleParameters from './components/Parameters';
import ModulePayloadResources from './components/PayloadResources';
import ModulePayloadScripts from './components/PayloadScripts';

interface SectionProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Section = (props: SectionProps) => {
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

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSectionDefaults = {
  defaultExpanded: true,
};

const CollapsibleSection = (props: CollapsibleSectionProps) => {
  return (
    <Grid item xs={8}>
      <Accordion defaultExpanded={props.defaultExpanded}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">{props.title}</Typography>
        </AccordionSummary>
        <AccordionDetails>{props.children}</AccordionDetails>
      </Accordion>
    </Grid>
  );
};

CollapsibleSection.defaultProps = CollapsibleSectionDefaults;

const ModuleEditor = () => {
  return (
    <Grid container spacing={1} alignItems="center" justifyContent="center">
      <CollapsibleSection title="Repository">
        <ModuleNameAndRepo />
      </CollapsibleSection>

      <CollapsibleSection title="Description">
        <ModuleDocString />
      </CollapsibleSection>

      <CollapsibleSection title="Input files">
        <ModuleInputs />
      </CollapsibleSection>

      <CollapsibleSection title="Output files">
        <ModuleOutputs />
      </CollapsibleSection>

      <CollapsibleSection title="Parameters">
        <ModuleParameters />
      </CollapsibleSection>

      <CollapsibleSection title="Environment">
        <ModuleEnvironment />
      </CollapsibleSection>

      <CollapsibleSection title="Scripts">
        <ModulePayloadScripts />
      </CollapsibleSection>

      <CollapsibleSection title="Resources">
        <ModulePayloadResources />
      </CollapsibleSection>

      <CollapsibleSection title="Commands">
        <ModuleCommands />
      </CollapsibleSection>

      <Section>
        <ModuleBuild />
      </Section>
    </Grid>
  );
};

export default ModuleEditor;
