import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import { builderSelectSnakemakeBackend, builderSetSnakemakeArgs } from 'redux/actions';

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const SnakemakeOptions: React.FC<{labelWidth: string}> = ({ labelWidth }) => {
  const dispatch = useAppDispatch();
  const snakemake_backend = useAppSelector((state) => state.builder.snakemake_backend);
  const snakemake_args = useAppSelector((state) => state.builder.snakemake_args);

  const selectSnakemakeBackend = (value: string) => dispatch(builderSelectSnakemakeBackend(value));
  const SetSnakemakeArgs = (args: string) => dispatch(builderSetSnakemakeArgs(args));

  return (
    <Box>
      <Typography variant="h6">
        Snakemake
      </Typography>
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
          <Typography variant="body1">Backend:</Typography>
        </Box>
        <Select
          defaultValue={snakemake_backend}
          onChange={(e) => selectSnakemakeBackend(e.target.value)}
          style={{ width: '100%' }}
          size="small"
        >
          <MenuItem value="builtin">Built-in</MenuItem>
          <MenuItem value="system">System</MenuItem>
        </Select>
      </Box>
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
            Arguments:
          </Typography>
        </Box>
        <TextField
          id="inputBuilderSettingsSnakemakeArgs"
          type="text"
          value={snakemake_args}
          onChange={(e) => SetSnakemakeArgs(e.target.value)}
          style={{ width: '100%' }}
          size="small"
        />
      </Box>
    </Box>
  );
};

export default SnakemakeOptions;
