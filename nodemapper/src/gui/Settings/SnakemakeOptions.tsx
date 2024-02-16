import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import { builderSelectSnakemakeBackend, builderSetSnakemakeArgs } from 'redux/actions';

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const SnakemakeOptions = () => {
  const dispatch = useAppDispatch();
  const snakemake_backend = useAppSelector((state) => state.builder.snakemake_backend);
  const snakemake_args = useAppSelector((state) => state.builder.snakemake_args);

  const selectSnakemakeBackend = (value: string) => dispatch(builderSelectSnakemakeBackend(value));
  const SetSnakemakeArgs = (args: string) => dispatch(builderSetSnakemakeArgs(args));

  return (
    <>
      <Typography variant="h6">Snakemake</Typography>
      <Typography variant="body1" align="left">
        Backend
      </Typography>
      <p>
        <Select
          defaultValue={snakemake_backend}
          onChange={(e) => selectSnakemakeBackend(e.target.value)}
          style={{ width: '100%' }}
          size="small"
        >
          <MenuItem value="builtin">Built-in</MenuItem>
          <MenuItem value="system">System</MenuItem>
        </Select>
      </p>
      <Typography variant="body1" align="left">
        Arguments
      </Typography>
      <p>
        <TextField
          id="inputBuilderSettingsSnakemakeArgs"
          type="text"
          value={snakemake_args}
          onChange={(e) => SetSnakemakeArgs(e.target.value)}
          style={{ width: '100%' }}
          size="small"
        />
      </p>
    </>
  );
};

export default SnakemakeOptions;
