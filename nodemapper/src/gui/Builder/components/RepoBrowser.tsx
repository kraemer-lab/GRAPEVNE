import React from 'react';
import { builderUpdateStatusText } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { TrayItemWidget } from './TrayItemWidget';
import { TrayWidget } from './TrayWidget';

import { builderGetRemoteModules } from 'redux/actions';
import BuilderEngine from './BuilderEngine';

import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/GridLegacy';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const hash = (s: string) => {
  let hash = 0,
    i,
    chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const RepoBrowser = () => {
  const dispatch = useAppDispatch();
  const modules = useAppSelector((state) => state.builder.modules_list);
  const repositories = useAppSelector((state) => state.settings.repositories);
  const loading = useAppSelector((state) => state.builder.modules_loading);

  const [filterFreetext, setFilterFreetext] = React.useState('');
  const [filterProject, setFilterProject] = React.useState('');
  const [filterRepo, setFilterRepo] = React.useState('');

  const [showSearchOptions, setShowSearchOptions] = React.useState(false);
  let modules_list = modules; // create a mutable copy

  // Check for a valid module list
  if (modules_list === undefined) {
    dispatch(
      builderUpdateStatusText(
        'ERROR: Module list failed to load - check that the repository name is ' +
          'correct and is reachable',
      ),
    );
    modules_list = [];
  }

  const updateTrayItems = (freetext: string, repo: string, prj: string) =>
    // We pass the filter values as parameters to ensure that the filters are applied
    // with the updated values, and not the state values which may not have refreshed
    modules_list
      .filter((m) => m['repo']['url'].startsWith(repo) || repo === '(all)')
      .filter((m) => m['org'].startsWith(prj) || prj === '(all)')
      .filter((m) => m['name'].toLowerCase().includes(freetext.toLowerCase()) || freetext === '')
      .map((m) => (
        <TrayItemWidget
          key={hash(JSON.stringify(m))}
          model={m}
          name={m['name']}
          color={BuilderEngine.GetModuleTypeColor(m['type'])}
        />
      ));

  const [trayitems, setTrayitems] = React.useState(updateTrayItems('', '', ''));
  React.useEffect(() => {
    setFilterRepo('(all)');
    setFilterProject('(all)');
    setTrayitems(updateTrayItems('', '', ''));
  }, [modules]);

  const onChangeFilterFreetext = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterFreetext(event.target.value);
    setTrayitems(updateTrayItems(event.target.value, filterRepo, filterProject));
  };

  const onChangeRepoList = (event: SelectChangeEvent) => {
    setFilterRepo(event.target.value);
    setTrayitems(updateTrayItems(filterFreetext, event.target.value, filterProject));
  };

  const onChangeProjectList = (event: SelectChangeEvent) => {
    setFilterProject(event.target.value);
    setTrayitems(updateTrayItems(filterFreetext, filterRepo, event.target.value));
  };

  const LookupRepoName = (repo: string) => {
    for (let i = 0; i < repositories.length; i++) {
      if (repositories[i]['repo'] === repo) {
        return repositories[i]['label'];
      }
    }
    return repo;
  };

  const RepoLabel = (repo: string) => {
    const repo_label = LookupRepoName(repo);
    if (repo_label === repo || repo === '(all)') {
      return <Typography>{repo}</Typography>;
    } else {
      return (
        <Stack>
          <Typography>{repo_label}</Typography>
          <Typography variant="caption">{repo}</Typography>
        </Stack>
      );
    }
  };

  // Extract unique repos from the module names for a filter list
  let filtered_modules = modules;
  const repo_list = filtered_modules
    .map((m) => m['repo']['url'])
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort(); // sort alphabetically
  repo_list.unshift('(all)'); // add "(all)" to the top of the list
  filtered_modules = filtered_modules.filter(
    (m) => m['repo']['url'] === filterRepo || filterRepo === '(all)',
  );

  // Extract unique projects from the module names for a filter list
  const project_list = filtered_modules
    .map((m) => m['org'])
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort(); // sort alphabetically
  project_list.unshift('(all)'); // add "(all)" to the top of the list
  if (!project_list.includes(filterProject)) {
    setFilterProject('(all)');
  }

  // Load modules from repository
  const btnGetModuleList = () => {
    dispatch(builderGetRemoteModules());
  };

  return (
    <Box
      sx={{
        height: '100%',
      }}
    >
      <Stack direction="column" sx={{ height: '100%' }}>
        <Paper sx={{ p: 1 }}>
          <Grid container spacing={0}>
            <Grid item xs={8}>
              <TextField
                id="repo-filter-freetext"
                name="repo-filter-freetext"
                placeholder="Search"
                value={filterFreetext}
                onChange={onChangeFilterFreetext}
                variant="outlined"
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="outlined"
                onClick={() => setShowSearchOptions(!showSearchOptions)}
                sx={{ height: '100%', minWidth: '5px' }}
                fullWidth
              >
                <FontAwesomeIcon icon={faEllipsisVertical} />
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                id="btnBuilderGetModuleList"
                variant="outlined"
                sx={{ height: '100%', minWidth: '5px' }}
                onClick={btnGetModuleList}
                fullWidth
              >
                <RefreshIcon />
              </Button>
            </Grid>
          </Grid>
          {showSearchOptions && (
            <Box
              p={1}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <Box>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="repolist-label">Repository</InputLabel>
                  <Select
                    name="repolist"
                    id="repolist"
                    value={filterRepo}
                    onChange={onChangeRepoList}
                    label="Repository"
                    labelId="repolist-label"
                    size="small"
                    fullWidth
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
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="prjlist-label">Project</InputLabel>
                  <Select
                    name="prjlist"
                    id="prjlist"
                    value={filterProject}
                    onChange={onChangeProjectList}
                    label="Project"
                    labelId="prjlist-label"
                    size="small"
                    fullWidth
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
          )}
        </Paper>
        {loading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {!loading && trayitems.length > 0 && (
          <>
            <Divider />
            <Paper sx={{ p: 1 }}>
              <TrayWidget>{trayitems}</TrayWidget>
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default RepoBrowser;
