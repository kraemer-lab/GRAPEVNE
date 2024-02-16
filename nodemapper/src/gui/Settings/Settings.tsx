import React from 'react';
import RepoOptions from './RepoOptions';

import { useEffect } from 'react';
import { builderSetEnvironmentVars, builderWriteStoreConfig } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import InterfaceOptions from './InterfaceOptions';
import SnakemakeOptions from './SnakemakeOptions';
import EnvironmentOptions from './EnvironmentOptions';
import DarkModeOption from './DarkModeOption';

const OptionsPanel = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  margin: '5px 10px',
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const Settings = () => {
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

  return (
    <Box
      sx={{
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        overflowY: 'auto',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '10px',
          alignSelf: 'flex-end',
        }}
      >
        <DarkModeOption />
      </Box>
      <Grid container spacing={0} alignItems="center" justifyContent="center">
        <Grid item xs={8}>
          <OptionsPanel>
            <RepoOptions labelWidth="25%" />
          </OptionsPanel>
        </Grid>
        <Grid item xs={8}>
          <OptionsPanel>
            <SnakemakeOptions labelWidth="25%" />
          </OptionsPanel>
        </Grid>
        <Grid item xs={8}>
          <OptionsPanel>
            <EnvironmentOptions labelWidth="25%" />
          </OptionsPanel>
        </Grid>
        <Grid item xs={8}>
          <OptionsPanel>
            <InterfaceOptions />
          </OptionsPanel>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
