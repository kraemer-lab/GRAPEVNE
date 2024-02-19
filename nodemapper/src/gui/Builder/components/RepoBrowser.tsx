import React from 'react';
import { builderUpdateStatusText } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { TrayItemWidget } from './TrayItemWidget';
import { TrayWidget } from './TrayWidget';

import { builderGetRemoteModules } from 'redux/actions';
import BuilderEngine from '../BuilderEngine';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';

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

  const [filterFreetext, setFilterFreetext] = React.useState('');
  const [filterOrg, setFilterOrg] = React.useState('');
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
    modules_list = '[]';
  }

  const updateTrayItems = () =>
    JSON.parse(modules_list)
      .filter((m) => m['repo'].startsWith(filterRepo) || filterRepo === '(all)')
      .filter((m) => m['org'].startsWith(filterOrg) || filterOrg === '(all)')
      .filter(
        (m) =>
          m['name'].toLowerCase().includes(filterFreetext.toLowerCase()) || filterFreetext === '',
      )
      .map((m) => (
        <TrayItemWidget
          key={hash(JSON.stringify(m))}
          model={m}
          name={m['name']}
          color={BuilderEngine.GetModuleTypeColor(m['type'])}
        />
      ));

  const [trayitems, setTrayitems] = React.useState(updateTrayItems());
  React.useEffect(() => {
    setFilterRepo('(all)');
    setFilterOrg('(all)');
    setTrayitems(updateTrayItems());
  }, [modules]);

  const onChangeFilterFreetext = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterFreetext(event.target.value);
    setTrayitems(updateTrayItems());
  };

  const onChangeRepoList = (event: SelectChangeEvent) => {
    setFilterRepo(event.target.value);
    setTrayitems(updateTrayItems());
  };

  const onChangeOrgList = (event: SelectChangeEvent) => {
    setFilterOrg(event.target.value);
    setTrayitems(updateTrayItems());
  };

  const filtered_modules = JSON.parse(modules);

  // Extract unique repos from the module names for a filter list
  const repo_list = filtered_modules
    .map((m) => m['repo'])
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort(); // sort alphabetically
  repo_list.unshift('(all)'); // add "(all)" to the top of the list
  const repo_list_options = repo_list.map((m) => (
    <MenuItem key={m} value={m}>
      {m}
    </MenuItem>
  ));

  // Extract unique organisations from the module names for a filter list
  const organisaton_list = filtered_modules
    .map((m) => m['org'])
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort(); // sort alphabetically
  organisaton_list.unshift('(all)'); // add "(all)" to the top of the list
  const organisaton_list_options = organisaton_list.map((m) => (
    <MenuItem key={m} value={m}>
      {m}
    </MenuItem>
  ));

  // Load modules from repository
  const btnGetModuleList = () => {
    dispatch(builderGetRemoteModules());
  };

  return (
    <Box>
      <Stack direction="column">
        <Paper sx={{ p: 1 }}>
          <Button
            id="btnBuilderGetModuleList"
            className="btn"
            onClick={btnGetModuleList}
            variant="outlined"
            fullWidth
          >
            LOAD MODULES
          </Button>
          <Grid container spacing={0}>
            <Grid item xs={10}>
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
                {/*showSearchOptions ? '-' : '+'*/}
                <FontAwesomeIcon icon={faEllipsisVertical} />
              </Button>
            </Grid>
          </Grid>
          {showSearchOptions && (
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
                  {repo_list_options}
                </Select>
              </FormControl>

              <FormControl variant="outlined" fullWidth>
                <InputLabel id="orglist-label">Project</InputLabel>
                <Select
                  name="orglist"
                  id="orglist"
                  value={filterOrg}
                  onChange={onChangeOrgList}
                  label="Project"
                  labelId="orglist-label"
                  size="small"
                  fullWidth
                >
                  {organisaton_list_options}
                </Select>
              </FormControl>
            </Box>
          )}
        </Paper>
        {filtered_modules.length > 0 && (
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
