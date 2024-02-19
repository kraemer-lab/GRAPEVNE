import React from 'react';

import { useAppDispatch } from 'redux/store/hooks';

import {
  builderBuildAndRun,
  builderBuildAsModule,
  builderBuildAsWorkflow,
  builderCleanBuildFolder,
  builderNodeDeselected,
  builderSetEdges,
  builderSetNodes,
} from 'redux/actions';

import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const Header = () => {
  const dispatch = useAppDispatch();

  // Build and Run dropdown menu state
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const btnBuildAndRunDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const btnBuildAndRunDropdownClose = () => {
    setAnchorEl(null);
  };

  /*
  // Load nodemap from file
  const btnLoadScene = () => {
    BuilderEngine.Instance.LoadScene();
  };

  // Save nodemap to file
  const btnSaveScene = () => {
    BuilderEngine.Instance.SaveScene();
  };
  */

  // Load nodemap from file
  const btnClearScene = () => {
    dispatch(builderNodeDeselected());
    dispatch(builderSetNodes([]));
    dispatch(builderSetEdges([]));
  };

  // Run - build and run the workflow
  const btnRun = () => {
    dispatch(builderBuildAndRun());
    btnBuildAndRunDropdownClose();
  };

  // Clean build folder
  const btnCleanBuildFolder = () => {
    dispatch(builderCleanBuildFolder());
    btnBuildAndRunDropdownClose();
  };

  // Build as module
  const btnBuildAsModule = () => {
    dispatch(builderBuildAsModule());
    btnBuildAndRunDropdownClose();
  };

  // Build as workflow
  const btnBuildAsWorkflow = () => {
    dispatch(builderBuildAsWorkflow());
    btnBuildAndRunDropdownClose();
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      {/*
        *** LOAD function needs to assign eventListeners on load
      <Button
        id="btnBuilderLoadScene"
        className="btn"
        onClick={btnLoadScene}
      >
        LOAD
      </Button>

      <Button
        id="btnBuilderSaveScene"
        className="btn"
        onClick={btnSaveScene}
      >
        SAVE
      </Button>
      */}

      <Button
        id="btnBuildAndRunDropdown"
        aria-controls={open ? 'buildAndRunDropdown-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={btnBuildAndRunDropdownClick}
        endIcon={<KeyboardArrowDownIcon />}
        variant="contained"
      >
        BUILD & RUN
      </Button>

      <Menu
        id="buildAndRunDropdown-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={btnBuildAndRunDropdownClose}
        MenuListProps={{
          'aria-labelledby': 'buildAndRunDropdown',
        }}
      >
        <MenuItem id="btnBuilderBuildAndTest" onClick={btnRun}>
          TEST BUILD
        </MenuItem>
        <MenuItem id="btnCleanBuildFolder" onClick={btnCleanBuildFolder}>
          DELETE TEST BUILD
        </MenuItem>
        <Divider />
        <MenuItem id="btnBuilderBuildAsModule" onClick={btnBuildAsModule}>
          BUILD AS MODULE
        </MenuItem>
        <MenuItem id="btnBuilderBuildAsWorkflow" onClick={btnBuildAsWorkflow}>
          BUILD AS WORKFLOW
        </MenuItem>
      </Menu>

      <Button id="btnBuilderClearScene" className="btn" onClick={btnClearScene} variant="contained">
        CLEAR GRAPH
      </Button>
    </Stack>
  );
};

export default Header;
