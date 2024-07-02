import React from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useAppSelector } from "redux/store/hooks";

const ConfigSelect = () => {
  const configfiles_list = useAppSelector((state) => state.builder.configfiles_list);
  const configfiles_names = configfiles_list.map((configfile) => configfile.split("/").pop());

  return (
    <Select
      labelId="config-file-select"
      id="config-file-select"
      value={"config.yaml"}
      onChange={(event) => {
        console.log(event.target.value);
      }}
      variant={"outlined"}
      size={"small"}
    >
      {configfiles_names.map((configfile) => (
        <MenuItem key={configfile} value={configfile}>
          {configfile}
        </MenuItem>
      ))}
    </Select>
  );
}

export default ConfigSelect;
