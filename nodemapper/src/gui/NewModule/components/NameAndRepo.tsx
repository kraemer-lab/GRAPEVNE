import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { newmoduleUpdateConfig } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const ModuleName = () => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const folderName = (name: string) => {
    return name.replace(/ /g, '');
  };

  const handleNameChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.name = e.target.value as string;
    newmoduleConfig.foldername = folderName(newmoduleConfig.name);
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', rowGap: 1, width: '100%' }}>
      <TextField
        sx={{ width: '100%' }}
        id="module-name"
        label="Module Name"
        variant="outlined"
        value={moduleConfig.name}
        onChange={handleNameChange}
      />
      <Typography>Folder Name: {folderName(moduleConfig.name)}</Typography>
    </Box>
  );
};

let first_run = true;

const ModuleRepo = () => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const modules = useAppSelector((state) => state.builder.modules_list);
  const dispatch = useAppDispatch();

  const repositories = useAppSelector((state) => state.builder.repositories);

  // Get the list of repositories, filtered by local [writable] repositories
  const repo_list = repositories
    .filter((m) => m['type'] === 'local')
    .map((m) => m['repo'])
    .sort(); // sort alphabetically
  repo_list.push('Zip file');

  // Extract unique projects from the module names for a filter list
  const filtered_modules = JSON.parse(modules);
  const project_list = filtered_modules
    .map((m) => m['org'])
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort(); // sort alphabetically
  if (project_list.length === 0) {
    project_list.push('(No projects found --- load modules list or create new)');
    project_list.push('(Add new project)');
  } else {
    project_list.unshift('(Add new project)');
  }

  // Update the module configuration with the default repo (first run only)
  if (first_run) {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.repo = repo_list[0];
    newmoduleConfig.project = 'Test';
    dispatch({ type: 'newmodule/update-config', payload: newmoduleConfig });
    first_run = false;
  }

  const [value, setValue] = React.useState(moduleConfig.repo);

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
  };

  const handleProjectChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.project = e.target.value as string;
    dispatch({ type: 'newmodule/update-config', payload: newmoduleConfig });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', rowGap: 1, width: '100%' }}>
      <Box>
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
      </Box>
      <Box>
        <FormControl fullWidth>
          <InputLabel id="module-project-label">Project</InputLabel>
          <Select
            id="module-project"
            label="Project"
            value={moduleConfig.project}
            onChange={handleProjectChange}
            sx={{ width: '100%' }}
            size="small"
          >
            {project_list.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

const ModuleNameAndRepo = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <ModuleName />
      </Grid>
      <Grid item xs={6}>
        <ModuleRepo />
      </Grid>
    </Grid>
  );
};

export default ModuleNameAndRepo;
