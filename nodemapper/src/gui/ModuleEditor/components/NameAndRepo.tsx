import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/GridLegacy';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { newmoduleUpdateConfig } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface AddNewProjectDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  callbackOk: (new_project: string) => void;
}

const AddNewProjectDialog = ({ open, setOpen, callbackOk }: AddNewProjectDialogProps) => {
  const handleClose = () => {
    setOpen(false);
  };

  const handleOk = () => {
    const new_project = (document.getElementById('ModuleEditorNewProjectName') as HTMLInputElement)
      .value;
    if (new_project === '') {
      alert('Please enter a project name');
      return;
    }
    callbackOk(new_project);
    handleClose();
  };

  return (
    <Box>
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add New Project</DialogTitle>
        <DialogContent>
          <DialogContentText>Enter the new project name here.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="ModuleEditorNewProjectName"
            label="Project name"
            type="text"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleOk} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface ModuleNameProps {
  setSelectedRepo: React.Dispatch<React.SetStateAction<string>>;
}

const ModuleName = ({ setSelectedRepo }: ModuleNameProps) => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const folderName = (name: string) => {
    return name.replace(/ /g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.name = e.target.value as string;
    newmoduleConfig.foldername = folderName(newmoduleConfig.name);
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  const handleImportConfig = () => {
    console.log('Import Config');
    // Import moduleConfig from a JSON file
    const element = document.createElement('input');
    element.type = 'file';
    element.accept = '.json';
    element.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newmoduleConfig = JSON.parse(e.target.result);
        newmoduleConfig.repo = 'Zip file';
        newmoduleConfig.project = '';
        dispatch(newmoduleUpdateConfig(newmoduleConfig));
        setSelectedRepo(newmoduleConfig.repo);
      };
      reader.readAsText(file);
    };
    element.click();
  };

  const handleExportConfig = () => {
    console.log('Export Config');
    // Export moduleConfig to a JSON file
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(moduleConfig, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = 'module_config.json';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
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
      <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: 1 }}>
        <Button variant="outlined" size="small" onClick={handleImportConfig}>
          Import Config
        </Button>
        <Button variant="outlined" size="small" onClick={handleExportConfig}>
          Export Config
        </Button>
      </Box>
    </Box>
  );
};

let first_run = true;

interface ModuleRepoProps {
  selectedRepo: string;
  setSelectedRepo: React.Dispatch<React.SetStateAction<string>>;
}

const ModuleRepo = ({ selectedRepo, setSelectedRepo }: ModuleRepoProps) => {
  // Get New Module configuration
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const modules = useAppSelector((state) => state.builder.modules_list);
  const dispatch = useAppDispatch();
  const repositories = useAppSelector((state) => state.settings.repositories);

  const [newProjectNameOpen, setNewProjectNameOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');

  // Callback function for the Add New Project dialog
  const newProjectNameCallback = (new_project: string) => {
    setNewProjectName(new_project); // keeps name in project list
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.project = new_project;
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  // Get the list of repositories, filtered by local [writable] repositories
  const repo_list = repositories
    .filter((m) => m['type'] === 'local')
    .map((m) => m['repo'])
    .sort(); // sort alphabetically
  repo_list.push('Zip file');

  // Extract unique projects from the module names for a filter list
  const filtered_modules = modules;
  const project_list = filtered_modules
    .filter((v) => v['repo']['url'] === selectedRepo)
    .map((m) => m['org'])
    .concat(newProjectName)
    .filter((v) => v !== '') // remove empty
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
    newmoduleConfig.project = '';
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
    setSelectedRepo(newmoduleConfig.repo);
    first_run = false;
  }

  const LookupRepoName = (repo: string) => {
    for (let i = 0; i < repositories.length; i++) {
      if (repositories[i]['repo'] === repo) {
        return repositories[i]['label'];
      }
    }
    return repo;
  };

  const RepoLabel = (repo: string) => {
    if (repo === 'Zip file') {
      return 'Zip file';
    } else {
      return LookupRepoName(repo);
    }
  };

  const RepoLocation = (repo: string) => {
    if (repo === 'Zip file') {
      return 'Output the module as a zip file';
    } else {
      return repo;
    }
  };

  const RepoListEntry = (repo: string) => {
    const repo_label = RepoLabel(repo);
    const repo_location = RepoLocation(repo);
    return (
      <Stack>
        <Typography>{repo_label}</Typography>
        <Typography variant="caption">{repo_location}</Typography>
      </Stack>
    );
  };

  const handleRepoChange = (e: any) => {
    setSelectedRepo(e.target.value as string);
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.repo = e.target.value as string;
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  const handleProjectChange = (e: any) => {
    const project = e.target.value as string;
    if (project === '(Add new project)') {
      // Add a new project
      setNewProjectNameOpen(true);
    } else {
      const newmoduleConfig = { ...moduleConfig };
      newmoduleConfig.project = project;
      dispatch(newmoduleUpdateConfig(newmoduleConfig));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', rowGap: 1, width: '100%' }}>
      <Box>
        <FormControl fullWidth>
          <InputLabel id="module-repo-label">Repository</InputLabel>
          <Select
            id="module-repo"
            label="Repository"
            value={selectedRepo}
            onChange={handleRepoChange}
            sx={{ width: '100%' }}
            size="small"
          >
            {repo_list.map((m) => (
              <MenuItem key={m} value={m}>
                {RepoListEntry(m)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box hidden={moduleConfig.repo === 'Zip file'}>
        <FormControl fullWidth>
          <InputLabel id="module-project-label">Project</InputLabel>
          <Select
            id="module-project"
            label="Project"
            value={moduleConfig.project}
            onChange={handleProjectChange}
            sx={{ width: '100%' }}
          >
            {project_list.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <AddNewProjectDialog
        open={newProjectNameOpen}
        setOpen={setNewProjectNameOpen}
        callbackOk={newProjectNameCallback}
      />
    </Box>
  );
};

const ModuleNameAndRepo = () => {
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const [selectedRepo, setSelectedRepo] = React.useState(moduleConfig.repo);

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <ModuleName setSelectedRepo={setSelectedRepo} />
      </Grid>
      <Grid item xs={6}>
        <ModuleRepo selectedRepo={selectedRepo} setSelectedRepo={setSelectedRepo} />
      </Grid>
    </Grid>
  );
};

export default ModuleNameAndRepo;
