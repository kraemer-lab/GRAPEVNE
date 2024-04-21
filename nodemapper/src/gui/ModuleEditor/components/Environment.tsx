import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import React from 'react';
import { newmoduleUpdateConfig } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import CondaSearch from './EnvCondaSearch';

const placeholder_env = `channels:
  - bioconda
dependencies:
  - python=3.11
  - pip
  - pip:
    - numpy`;

const ModuleEnvironment = () => {
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const handleEnvChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.env = e.target.value as string;
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', rowGap: 1 }}>
      <TextField
        id="module-environment"
        variant="outlined"
        placeholder={placeholder_env}
        value={moduleConfig.env}
        onChange={handleEnvChange}
        multiline
        rows={8}
        sx={{ width: '100%' }}
      />
      <Divider />
      <CondaSearch />
    </Box>
  );
};

export default ModuleEnvironment;
