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

const EnvironmentOptions: React.FC<{ labelWidth: string }> = ({ labelWidth }) => {
  const dispatch = useAppDispatch();

  const environment_vars = useAppSelector((state) => state.builder.environment_variables);
  const SetEnvironmentVars = (args: string) => dispatch(builderSetEnvironmentVars(args));

  return (
    <Box>
      <Typography variant="h6">Environment</Typography>
      <Box
        style={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'row',
        }}
      >
        <Box
          style={{
            width: labelWidth,
            textAlign: 'right',
            alignSelf: 'center',
          }}
        >
          <Typography variant="body1">
            Variables
          </Typography>
        </Box>
        <TextField
          id="inputBuilderSettingsEnvironmentVars"
          type="text"
          value={environment_vars}
          onChange={(e) => SetEnvironmentVars(e.target.value)}
          style={{ width: '100%' }}
          size="small"
        />
      </Box>
    </Box>
  );
};

export default EnvironmentOptions;
