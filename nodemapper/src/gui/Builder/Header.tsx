import { DropdownMenu, NestedMenuItem, useMenu } from 'components/DropdownMenu';
import React from 'react';
import { MenuBuildModule } from './components/MenuBuildModule';

import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import {
  builderBuildAndRun,
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

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

const MenuGraphDropdown = () => {
  const dispatch = useAppDispatch();
  const { closeAllMenus } = useMenu();

  // Load scene from file
  const btnLoadScene = () => {
    closeAllMenus();
    dispatch(builderLoadScene());
  };

  // Save scene to file
  const btnSaveScene = () => {
    closeAllMenus();
    dispatch(builderSaveScene());
  };

  const btnBuilderExportAsPNG = () => {
    closeAllMenus();
    dispatch(builderExportAsPNG());
  };

  const btnBuilderExportAsSVG = () => {
    closeAllMenus();
    dispatch(builderExportAsSVG());
  };

  // Clear scene / canvas
  const btnClearScene = () => {
    closeAllMenus();
    dispatch(builderNodeDeselected());
    dispatch(builderSetNodes([]));
    dispatch(builderSetEdges([]));
  };
  return (
    <>
      <MenuItem id="btnBuilderLoadScene" onClick={btnLoadScene}>
        LOAD
      </MenuItem>
      <MenuItem id="btnBuilderSaveScene" onClick={btnSaveScene}>
        SAVE
      </MenuItem>
      <NestedMenuItem label="EXPORT">
        <MenuItem id="btnBuilderExportAsPNG" onClick={btnBuilderExportAsPNG}>
          PNG
        </MenuItem>
        <MenuItem id="btnBuilderExportAsSVG" onClick={btnBuilderExportAsSVG}>
          SVG
        </MenuItem>
      </NestedMenuItem>
      <MenuItem id="btnBuilderClearScene" onClick={btnClearScene}>
        CLEAR
      </MenuItem>
    </>
  );
};

const MenuBuildAndRunDropdown = () => {
  const dispatch = useAppDispatch();
  const { closeAllMenus } = useMenu();

  // Run - build and run the workflow
  const btnRun = () => {
    closeAllMenus();
    dispatch(builderBuildAndRun());
  };

  // Clean build folder
  const btnCleanBuildFolder = () => {
    closeAllMenus();
    dispatch(builderCleanBuildFolder());
  };

  // Build as workflow
  const btnBuildAsWorkflow = () => {
    closeAllMenus();
    dispatch(builderBuildAsWorkflow());
  };

  // Package workflow
  const btnPackageWorkflow = () => {
    closeAllMenus();
    dispatch(builderPackageWorkflow());
  };

  return (
    <>
      <MenuItem id="btnBuilderBuildAndTest" onClick={btnRun}>
        TEST BUILD
      </MenuItem>
      <MenuItem id="btnCleanBuildFolder" onClick={btnCleanBuildFolder}>
        DELETE TEST BUILD
      </MenuItem>
      <Divider />
      <MenuBuildModule />
      <MenuItem id="btnBuilderBuildAsWorkflow" onClick={btnBuildAsWorkflow}>
        BUILD WORKFLOW
      </MenuItem>
      <MenuItem id="btnBuilderPackageWorkflow" onClick={btnPackageWorkflow}>
        PACKAGE WORKFLOW
      </MenuItem>
    </>
  );
};

const Header = () => {
  const dispatch = useAppDispatch();
  const build_in_progress = useAppSelector((state) => state.builder.build_in_progress);

  // Has a test build been run yet?
  const hasTestRun = useAppSelector((state) => state.builder.workdir !== '');

  // Open results folder
  const btnOpenResultsFolder = () => {
    dispatch(builderOpenResultsFolder());
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      {/* Scene menu */}
      <DropdownMenu id="btnGraphDropdown" label="SCENE">
        <MenuGraphDropdown />
      </DropdownMenu>

      {/* Build and run menu */}
      <Box>
        <DropdownMenu id="btnBuildAndRunDropdown" label="BUILD & RUN" disabled={build_in_progress}>
          <MenuBuildAndRunDropdown />
        </DropdownMenu>
        {build_in_progress && <LinearProgress />}
      </Box>

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
