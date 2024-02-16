import React from "react";
import { builderToggleDarkMode } from "redux/actions";
import { FormControl, FormControlLabel, FormGroup, Switch } from "@mui/material";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";

const DarkModeOption = () => {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.builder.dark_mode);
  const handleToggleDarkMode = () => {
    dispatch(builderToggleDarkMode());
  }

  return (
    <FormControl>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={handleToggleDarkMode}
              name="darkMode"
            />
          }
          label="Dark Mode"
        />
      </FormGroup>
    </FormControl>
  );
};

export default DarkModeOption;
