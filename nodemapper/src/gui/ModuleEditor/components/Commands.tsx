import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const placeholder_command = `echo "Hello World" > {output.OutputFileLabel}`;

const ModuleCommands = () => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const handleDirectiveChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.command_directive = e.target.value as string;
    dispatch({ type: 'newmodule/update-config', payload: newmoduleConfig });
  };

  const handleCommandChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.command = e.target.value as string;
    dispatch({ type: 'newmodule/update-config', payload: newmoduleConfig });
  };

  const DirectiveSelect = () => {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'flex-start' }}>
        <FormControl>
          <InputLabel id="module-script-label">Directive</InputLabel>
          <Select
            labelId="module-script-label"
            id="module-script-select"
            value={moduleConfig.command_directive}
            onChange={handleDirectiveChange}
            size="small"
            label="Directive"
          >
            <MenuItem value="shell">Shell</MenuItem>
            <MenuItem value="run">Run</MenuItem>
            <MenuItem value="script">Script</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        Provide the commands to be executed by the module. You can make use of
        &#123;input.Label&#125;, &#123;output.Label&#125; and &#123;params.Name&#125; to reference
        input filenames, output filenames and parameter values, respectively.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', rowGap: 1 }}>
        <TextField
          id="module-script"
          variant="outlined"
          multiline
          rows={6}
          sx={{width: '100%'}}
          placeholder={placeholder_command}
          value={moduleConfig.command}
          onChange={handleCommandChange}
          InputProps={{ endAdornment: <DirectiveSelect /> }}
        />
      </Box>
    </Box>
  );
};

export default ModuleCommands;
