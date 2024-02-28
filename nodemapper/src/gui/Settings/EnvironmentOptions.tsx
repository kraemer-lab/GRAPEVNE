import React from 'react';

import { builderSetEnvironmentVars } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

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
          <Typography variant="body1">Variables</Typography>
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
