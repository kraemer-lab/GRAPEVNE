import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useAppDispatch } from 'redux/store/hooks';
import { newmoduleBuild, newmoduleOpenModuleFolder, newmoduleValidate } from 'redux/actions';

const ModuleBuild = () => {
  const dispatch = useAppDispatch();

  const handleBuildClick = () => {
    dispatch(newmoduleBuild());
  };

  const handleValidateClick = () => {
    dispatch(newmoduleValidate());
  };

  const handleOpenModuleFolder = () => {
    dispatch(newmoduleOpenModuleFolder());
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Build
      </Typography>
      <Typography variant="body2" gutterBottom>
        Create the module by building it from the provided configuration.
      </Typography>
      <Divider />
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={1} alignItems="center" justifyContent="center">
          <Grid item>
            <Button id="btnNewModuleBuild" variant="contained" onClick={handleBuildClick}>
              Build
            </Button>
          </Grid>
          <Grid item>
            <Button id="btnNewModuleValidate" variant="contained" onClick={handleValidateClick} disabled>
              Validate
            </Button>
          </Grid>
          <Grid item>
            <Button id="btnNewModuleOpenModuleFolder" variant="contained" onClick={handleOpenModuleFolder} disabled>
              Open module folder
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ModuleBuild;
