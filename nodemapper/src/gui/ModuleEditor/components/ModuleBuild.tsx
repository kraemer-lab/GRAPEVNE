import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import React from 'react';

import { newmoduleBuild, newmoduleClear, newmoduleOpenModuleFolder } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const ModalBuildingStatus = ({ open }: { open: boolean }) => {
  return (
    <Modal open={open} onClose={() => {}}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Box sx={{ alignItems: 'center', textAlign: 'center', background: 'white', p: 4 }}>
          <CircularProgress />
          <Box sx={{ height: 20 }} />
          <Typography variant="subtitle1" gutterBottom>
            Building module...
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

const ModuleBuild = () => {
  const moduleState = useAppSelector((state) => state.newmodule);
  const building = useAppSelector((state) => state.newmodule.result.building);
  const dispatch = useAppDispatch();

  const handleBuildClick = () => {
    dispatch(newmoduleBuild());
  };

  const handleClearClick = () => {
    dispatch(newmoduleClear());
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
          {/*<Grid item>
            <Button
              id="btnNewModuleValidate"
              variant="contained"
              onClick={handleValidateClick}
              disabled={!moduleState.result.folder}
            >
              Validate
            </Button>
          </Grid>*/}
          <Grid item>
            <Button
              id="btnNewModuleOpenModuleFolder"
              variant="contained"
              onClick={handleOpenModuleFolder}
              disabled={!moduleState.result.folder}
            >
              Open module folder
            </Button>
          </Grid>
          <Grid item>
            <Button id="btnNewModuleClear" variant="contained" onClick={handleClearClick}>
              Clear
            </Button>
          </Grid>
        </Grid>
        <ModalBuildingStatus open={building} />
      </Box>
    </Box>
  );
};

export default ModuleBuild;
