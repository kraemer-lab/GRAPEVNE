import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const ModuleName = () => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const handleNameChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.name = e.target.value as string;
    dispatch({ type: 'newmodule/update-config', payload: newmoduleConfig });
  };

  return (
    <TextField
      sx={{ width: '100%' }}
      id="module-name"
      label="Module Name"
      variant="outlined"
      value={moduleConfig.name}
      onChange={handleNameChange}
    />
  );
};

const ModuleRepo = () => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const repositories = useAppSelector((state) => state.builder.repositories);

  // Get the list of repositories, filtered by local [writable] repositories
  const repo_list = repositories
    .filter((m) => m['type'] === 'local')
    .map((m) => m['repo'])
    .sort(); // sort alphabetically
  repo_list.push('Zip file');

  const default_repo = moduleConfig["repo"] ? moduleConfig["repo"] : repo_list[0];
  const [value, setValue] = React.useState(default_repo);

  const LookupRepoName = (repo: string) => {
    for (let i = 0; i < repositories.length; i++) {
      if (repositories[i]['repo'] === repo) {
        return repositories[i]['label'];
      }
    }
    return repo;
  };

  const RepoLabel = (repo: string) => {
    let repo_label = '';
    let repo_location = '';
    if (repo === 'Zip file') {
      repo_label = 'Zip file';
      repo_location = 'Output the module as a zip file';
    } else {
      repo_label = LookupRepoName(repo);
      repo_location = repo;
    }
    return (
      <Stack>
        <Typography>{repo_label}</Typography>
        <Typography variant="caption">{repo_location}</Typography>
      </Stack>
    );
  };

  const handleRepoChange = (e: any) => {
    setValue(e.target.value as string);
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.repo = e.target.value as string;
    dispatch({ type: 'newmodule/update-config', payload: newmoduleConfig });
  }

  return (
    <FormControl fullWidth>
      <InputLabel id="module-repo-label">Repository</InputLabel>
      <Select
        id="module-repo"
        label="Repository"
        value={value}
        onChange={handleRepoChange}
        sx={{ width: '100%' }}
        size="small"
      >
        {repo_list.map((m) => (
          <MenuItem key={m} value={m}>
            {RepoLabel(m)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const ModuleNameAndRepo = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: 1, width: '100%' }}>
      <ModuleName />
      <ModuleRepo />
    </Box>
  );
};

export default ModuleNameAndRepo;
