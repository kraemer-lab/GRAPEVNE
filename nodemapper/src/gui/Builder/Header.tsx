import React from 'react';

import { useAppDispatch } from 'redux/store/hooks';

import {
  builderBuildAndRun,
  builderBuildAsModule,
  builderBuildAsWorkflow,
  builderCleanBuildFolder,
  builderGetRemoteModules,
  builderNodeDeselected,
  builderSetEdges,
  builderSetNodes,
} from 'redux/actions';

import Menu from "@mui/material/Menu";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";

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

  // Load modules from repository
  const btnGetModuleList = () => {
    dispatch(builderGetRemoteModules());
  };

  return (
    <>
      <link href="http://fonts.googleapis.com/css?family=Oswald" rel="stylesheet" type="text/css" />
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
        id="btnBuilderGetModuleList"
        className="btn"
        onClick={btnGetModuleList}
        variant="outlined"
      >
        GET MODULE LIST
      </Button>

      <Button
        id="btnBuildAndRunDropdown"
        aria-controls={open ? 'buildAndRunDropdown-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={btnBuildAndRunDropdownClick}
        variant="outlined"
      >
        BUILD & RUN ...
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
        <MenuItem
          id="btnBuilderBuildAndTest"
          onClick={btnRun}
        >
          TEST BUILD
        </MenuItem>
        <MenuItem
          id="btnBuilderBuildAsModule"
          onClick={btnBuildAsModule}
        >
          BUILD AS MODULE
        </MenuItem>
        <MenuItem
          id="btnBuilderBuildAsWorkflow"
          onClick={btnBuildAsWorkflow}
        >
          BUILD AS WORKFLOW
        </MenuItem>
      </Menu>

      <Button
        id="btnBuilderCleanBuildFolder"
        className="btn"
        onClick={btnCleanBuildFolder}
        variant="outlined"
      >
        DELETE TEST BUILD
      </Button>

      <Button
        id="btnBuilderClearScene"
        className="btn"
        onClick={btnClearScene}
        variant="outlined"
      >
        CLEAR GRAPH
      </Button>
    </>
  );
};

export default Header;
