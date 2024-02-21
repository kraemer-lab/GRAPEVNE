import React from 'react';

import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import {
  builderBuildAndRun,
  builderBuildAsModule,
  builderBuildAsWorkflow,
  builderCleanBuildFolder,
  builderLoadScene,
  builderNodeDeselected,
  builderOpenResultsFolder,
  builderSaveScene,
  builderSetEdges,
  builderSetNodes,
} from 'redux/actions';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

const Header = () => {
  const dispatch = useAppDispatch();

  // Dropdown menu states
  const [anchorEl_graph, setAnchorEl_graph] = React.useState<null | HTMLElement>(null);
  const [anchorEl_buildandrun, setAnchorEl_buildandrun] = React.useState<null | HTMLElement>(null);
  const open_graph = Boolean(anchorEl_graph);
  const open_buildandrun = Boolean(anchorEl_buildandrun);

  const btnGraphDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl_graph(event.currentTarget);
  };

  const btnGraphDropdownClose = () => {
    setAnchorEl_graph(null);
  };

  const btnBuildAndRunDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl_buildandrun(event.currentTarget);
  };

  const btnBuildAndRunDropdownClose = () => {
    setAnchorEl_buildandrun(null);
  };

  // Has a test build been run yet?
  const hasTestRun = useAppSelector((state) => state.builder.workdir !== '');

  // Load nodemap from file
  const btnLoadScene = () => {
    dispatch(builderLoadScene());
    btnGraphDropdownClose();
  };

  // Save nodemap to file
  const btnSaveScene = () => {
    dispatch(builderSaveScene());
    btnGraphDropdownClose();
  };

  // Load nodemap from file
  const btnClearScene = () => {
    dispatch(builderNodeDeselected());
    dispatch(builderSetNodes([]));
    dispatch(builderSetEdges([]));
    btnGraphDropdownClose();
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
    btnGraphDropdownClose();
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

  // Open results folder
  const btnOpenResultsFolder = () => {
    dispatch(builderOpenResultsFolder());
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Button
        id="btnGraphDropdown"
        aria-controls={open ? 'graph-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={btnGraphDropdownClick}
        endIcon={<KeyboardArrowDownIcon />}
        variant="contained"
      >
        SCENE
      </Button>

      <Menu
        id="graph-menu"
        anchorEl={anchorEl_graph}
        open={open_graph}
        onClose={btnGraphDropdownClose}
        MenuListProps={{
          'aria-labelledby': 'graphDropdown',
        }}
      >
        <MenuItem id="btnBuilderLoadScene" onClick={btnLoadScene}>
          LOAD
        </MenuItem>
        <MenuItem id="btnBuilderSaveScene" onClick={btnSaveScene}>
          SAVE
        </MenuItem>
        <MenuItem id="btnBuilderClearScene" onClick={btnClearScene}>
          CLEAR
        </MenuItem>
      </Menu>

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
        anchorEl={anchorEl_buildandrun}
        open={open_buildandrun}
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

      <Button
        id="btnBuilderOpenResultsFolder"
        className="btn"
        onClick={btnOpenResultsFolder}
        variant="contained"
        disabled={hasTestRun ? false : true}
      >
        OPEN RESULTS
      </Button>
    </Stack>
  );
};

export default Header;
