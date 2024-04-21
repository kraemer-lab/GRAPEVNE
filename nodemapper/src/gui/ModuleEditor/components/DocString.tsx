import HelpIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const placeholder_docstring = `Provide a short (one-line) description of the module.

Then provide a longer description which can cover several lines or paragraphs, including links to any websites that may be relevant.

Params:
  param1 (str): Provide a description of any parameters that may be used by the module.`;

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
      <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: 1 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Provide a description for the module. This can be formatted as Markdown.">
          <IconButton>
            <HelpIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <TextField
        id="module-docstring"
        variant="outlined"
        multiline
        rows={6}
        sx={{ width: '100%' }}
        placeholder={placeholder_docstring}
        value={moduleConfig.docstring}
        onChange={handleDocstringChange}
      />
    </Box>
  );
};

export default ModuleDocString;
