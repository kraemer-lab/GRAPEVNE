import { DropdownMenu, NestedMenuItem } from 'components/DropdownMenu';
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

const Header = () => {
  const build_in_progress = useAppSelector((state) => state.builder.build_in_progress);
  const dispatch = useAppDispatch();

  // Has a test build been run yet?
  const hasTestRun = useAppSelector((state) => state.builder.workdir !== '');

  // Load scene from file
  const btnLoadScene = () => {
    dispatch(builderLoadScene());
  };

  // Save scene to file
  const btnSaveScene = () => {
    dispatch(builderSaveScene());
  };

  const btnBuilderExportAsPNG = () => {
    dispatch(builderExportAsPNG());
  };

  const btnBuilderExportAsSVG = () => {
    dispatch(builderExportAsSVG());
  };

  // Clear scene / canvas
  const btnClearScene = () => {
    dispatch(builderNodeDeselected());
    dispatch(builderSetNodes([]));
    dispatch(builderSetEdges([]));
  };

  // Run - build and run the workflow
  const btnRun = () => {
    dispatch(builderBuildAndRun());
  };

  // Clean build folder
  const btnCleanBuildFolder = () => {
    dispatch(builderCleanBuildFolder());
  };

  // Build as workflow
  const btnBuildAsWorkflow = () => {
    dispatch(builderBuildAsWorkflow());
  };

  // Package workflow
  const btnPackageWorkflow = () => {
    dispatch(builderPackageWorkflow());
  };

  // Open results folder
  const btnOpenResultsFolder = () => {
    dispatch(builderOpenResultsFolder());
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      {/* Scene menu */}
      <DropdownMenu label="SCENE">
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
      </DropdownMenu>

      {/* Build and run menu */}
      <Box>
        <DropdownMenu label="BUILD & RUN" disabled={build_in_progress}>
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
          {build_in_progress && <LinearProgress />}
        </DropdownMenu>
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
