import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/GridLegacy';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { newmoduleUpdateConfig } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const InputPorts = () => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const [editValue, setEditValue] = React.useState('');

  const setPorts = (ports) => {
    const newmoduleConfig = { ...moduleConfig };
    // Remove duplicates
    newmoduleConfig.ports = ports.filter((value, index, array) => array.indexOf(value) === index);
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  const onEditChange = (value: string) => {
    setEditValue(value);
    if (value.endsWith('\n') || value.endsWith(' ')) {
      if (value.trim().endsWith(',') || value.trim().endsWith(';'))
        value = value.trim().slice(0, -1);
      if (!value) return;
      setPorts([...moduleConfig.ports, value.trim()]);
      setEditValue('');
    }
  };

  const handleDelete = (port: string) => {
    setPorts(moduleConfig.ports.filter((p) => p !== port));
  };

  return (
    <Box sx={{ width: '100%' }}>
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

export default InputPorts;
