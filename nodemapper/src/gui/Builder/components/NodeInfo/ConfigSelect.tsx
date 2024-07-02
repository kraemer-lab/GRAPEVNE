import React, {useState} from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useAppDispatch, useAppSelector } from "redux/store/hooks";
import { builderUpdateNodeInfoKey } from "redux/actions/builder";
import yaml from "yaml";

const displayAPI = window.displayAPI;
const builderAPI = window.builderAPI;

const ConfigSelect = () => {
  const dispatch = useAppDispatch();
  const configfiles_list_state = useAppSelector((state) => state.builder.configfiles_list);
  const configfiles_list = [...configfiles_list_state, "(Select file)"];
  const configfiles_names = configfiles_list.map((configfile) => configfile.split("/").pop());

  const default_configfile = configfiles_names[0] ?? "";
  const [value, setValue] = useState(default_configfile);

  const ParseAndModifyConfig = (contents: string) => {
    // Overwrite parameters structure (note: should use key-matching validation here)
    const params = yaml.parse(contents);
    const keylist = ['config'];
    const key = 'params';
    const value = params;
    dispatch(builderUpdateNodeInfoKey({ keys: [...keylist, key], value: value }));
  }

  const ReadAndModifyConfig = (filename: string) => {
    // Read select config file
    builderAPI.GetFile(filename)
      .then((contents) => {
        // Parse and update current configuration
        ParseAndModifyConfig(contents);
      })
      .catch((error) => {
        console.log('Cannot read configuration file: ', error);
      });
  }

  const OnChange = (newvalue: string) => {
    // Check if "(Select file)" has been selected
    if (newvalue === "(Select file)") {
      // Poll user for filename
      displayAPI.SelectFile(value)
        .then((filename) => ReadAndModifyConfig(filename[0]))
        .catch((error) => {
          console.log('Cannot select configuration file: ', error);
          return;
        });
    }

    // Get full filename associated with item
    const index = configfiles_names.indexOf(newvalue);
    const fullfile = configfiles_list[index];

    // Read select config file
    ReadAndModifyConfig(fullfile);
    // Update selection value
    setValue(newvalue);
  }

  return (
    <Select
      labelId="config-file-select"
      id="config-file-select"
      value={value}
      onChange={(event) => { OnChange(event.target.value) }}
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
