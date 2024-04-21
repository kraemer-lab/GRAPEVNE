import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const Parameters = () => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const handleParamsChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.params = e.target.value as string;
    dispatch({ type: 'newmodule/update-config', payload: newmoduleConfig });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="body2" gutterBottom>
        Parameter defaults (in YAML format)
      </Typography>
      <TextField
        id="module-params"
        variant="outlined"
        placeholder={`param1: value1
"Parameter name 2": "Parameter value 2"`}
        multiline
        rows={6}
        value={moduleConfig.params}
        onChange={handleParamsChange}
        sx={{ width: '100%' }}
      />
    </Box>
  );
};

const ModuleParameters = () => {
  return <Parameters />;
};

export default ModuleParameters;
