import React from 'react';

import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import {
  builderBuildAndRun,
  builderBuildAsModule,
  builderBuildAsWorkflow,
  builderCleanBuildFolder,
  builderExportAsPNG,
  builderExportAsSVG,
  builderLoadScene,
  builderNodeDeselected,
  builderOpenResultsFolder,
  builderPackageWorkflow,
  builderSaveScene,
  builderSetEdges,
  builderSetNodes,
} from 'redux/actions';

import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

const Header = () => {
  const build_in_progress = useAppSelector((state) => state.builder.build_in_progress);
  const dispatch = useAppDispatch();

  // Dropdown menu states
  const [anchorEl_graph, setAnchorEl_graph] = React.useState<null | HTMLElement>(null);
  const [anchorEl_buildandrun, setAnchorEl_buildandrun] = React.useState<null | HTMLElement>(null);
  const [anchorEl_export, setAnchorEl_export] = React.useState<null | HTMLElement>(null);
  const open_graph = Boolean(anchorEl_graph);
  const open_buildandrun = Boolean(anchorEl_buildandrun);
  const open_export = Boolean(anchorEl_export);

  const btnGraphDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl_graph(event.currentTarget);
    setAnchorEl_export(null);
  };

  const btnGraphDropdownClose = () => {
    setAnchorEl_graph(null);
    setAnchorEl_export(null);
  };

  const btnBuildAndRunDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl_buildandrun(event.currentTarget);
  };

  const btnBuildAndRunDropdownClose = () => {
    setAnchorEl_buildandrun(null);
  };

  // Has a test build been run yet?
  const hasTestRun = useAppSelector((state) => state.builder.workdir !== '');

  // Load scene from file
  const btnLoadScene = () => {
    dispatch(builderLoadScene());
    btnGraphDropdownClose();
  };

  // Save scene to file
  const btnSaveScene = () => {
    dispatch(builderSaveScene());
    btnGraphDropdownClose();
  };

  const btnExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl_export(event.currentTarget);
  };

  const btnExportClose = () => {
    setAnchorEl_export(null);
  };

  const btnBuilderExportAsPNG = () => {
    dispatch(builderExportAsPNG());
    btnExportClose();
    btnGraphDropdownClose();
  };

  const btnBuilderExportAsSVG = () => {
    dispatch(builderExportAsSVG());
    btnExportClose();
    btnGraphDropdownClose();
  };

  // Clear scene / canvas
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

  // Package workflow
  const btnPackageWorkflow = () => {
    dispatch(builderPackageWorkflow());
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

      {/* Scene menu */}
      <Menu
        id="graph-menu"
        anchorEl={anchorEl_graph}
        open={open_graph}
        onClose={btnGraphDropdownClose}
        MenuListProps={{
          'aria-labelledby': 'graphDropdown',
        }}
      >
        <Box sx={{ width: 150 }}>
          <MenuItem id="btnBuilderLoadScene" onClick={btnLoadScene}>
            LOAD
          </MenuItem>
          <MenuItem id="btnBuilderSaveScene" onClick={btnSaveScene}>
            SAVE
          </MenuItem>
          <MenuItem id="btnBuilderExport" onClick={btnExportClick}>
            EXPORT
            <Box style={{ flexGrow: 1 }} />
            <ArrowRightIcon />
          </MenuItem>
          <MenuItem id="btnBuilderClearScene" onClick={btnClearScene}>
            CLEAR
          </MenuItem>
        </Box>
      </Menu>

      {/* Scene - Export sub-menu */}
      <Menu
        open={open_export}
        anchorEl={anchorEl_export}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={() => {
          setAnchorEl_export(null);
        }}
        disableAutoFocusItem
        autoFocus={false}
      >
        <MenuItem id="btnBuilderExportAsPNG" onClick={btnBuilderExportAsPNG}>
          PNG
        </MenuItem>
        <MenuItem id="btnBuilderExportAsSVG" onClick={btnBuilderExportAsSVG}>
          SVG
        </MenuItem>
      </Menu>

      {/* Build & Run menu */}
      <Box>
        <Button
          id="btnBuildAndRunDropdown"
          aria-controls={open ? 'buildAndRunDropdown-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={btnBuildAndRunDropdownClick}
          endIcon={<KeyboardArrowDownIcon />}
          variant="contained"
          disabled={build_in_progress}
        >
          BUILD & RUN
        </Button>
        {build_in_progress && <LinearProgress />}
      </Box>

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
          BUILD MODULE
        </MenuItem>
        <MenuItem id="btnBuilderBuildAsWorkflow" onClick={btnBuildAsWorkflow}>
          BUILD WORKFLOW
        </MenuItem>
        <MenuItem id="btnBuilderPackageWorkflow" onClick={btnPackageWorkflow}>
          PACKAGE WORKFLOW
        </MenuItem>
      </Menu>

      {/* Open results folder */}
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
