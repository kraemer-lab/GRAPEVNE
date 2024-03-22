import HelpIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const ModuleDocString = () => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const handleDocstringChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.docstring = e.target.value as string;
    dispatch({ type: 'newmodule/update-config', payload: newmoduleConfig });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: 1 }}>
          Description
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Provide a description for the module. This can be formatted as Markdown.">
            <IconButton>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Typography>
      <TextField
        id="module-docstring"
        variant="outlined"
        multiline
        rows={6}
        sx={{ width: '100%' }}
        value={moduleConfig.docstring}
        onChange={handleDocstringChange}
      />
    </Box>
  );
};

export default ModuleDocString;
