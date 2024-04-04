import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const ModulePorts = () => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const [editValue, setEditValue] = React.useState('');

  const setPorts = (ports) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.ports = ports;
    dispatch({ type: 'newmodule/update-config', payload: newmoduleConfig });
  };

  const onEditChange = (value: string) => {
    setEditValue(value);
    if (value.endsWith('\n') || value.endsWith(' ')) {
      if (value.trim().endsWith(',') || value.trim().endsWith(';'))
        value = value.trim().slice(0, -1);
      if (!value)
        return;
      setPorts([...moduleConfig.ports, value.trim()]);
      setEditValue('');
    }
  };

  const handleDelete = (port: string) => {
    setPorts(moduleConfig.ports.filter((p) => p !== port));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Ports
      </Typography>
      <Typography variant="body2" gutterBottom>
        Input port names
      </Typography>
      <Stack direction="column" spacing={1}>
        <TextField
          id="module-ports"
          variant="outlined"
          value={editValue}
          multiline // Permits the newline character to be parsed in the input
          maxRows={1} // Restrict input visually to a single line
          onChange={(e) => onEditChange(e.target.value)}
          sx={{ width: '100%' }}
        />
        <Grid id="newmodule-ports-container" container spacing={1}>
          {moduleConfig.ports.length === 0 && (
            <Grid item>
              <Typography variant="body2" gutterBottom>
                No ports
              </Typography>
            </Grid>
          )}
          {moduleConfig.ports.map((port) => (
            <Grid item key={port}>
              <Chip
                label={port}
                color="primary"
                variant="outlined"
                onDelete={() => handleDelete(port)}
              />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Box>
  );
};

const ModuleParameters = () => {
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
      <Typography variant="h6" gutterBottom>
        Parameters
      </Typography>
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

const ModuleConfig = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: 1, width: '100%' }}>
      <ModulePorts />
      <ModuleParameters />
    </Box>
  );
};

export default ModuleConfig;
