import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { newmoduleUpdateConfig } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import CondaSearch from './EnvCondaSearch';

const ModuleEnvironment = () => {
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const handleEnvChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.env = e.target.value as string;
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Environment
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: 1 }}>
        <TextField
          id="module-environment"
          label="Conda configuration"
          variant="outlined"
          value={moduleConfig.env}
          onChange={handleEnvChange}
          multiline
          rows={8}
          sx={{ width: '100%' }}
        />
        <CondaSearch />
      </Box>
    </Box>
  );
};

export default ModuleEnvironment;
