import React from 'react';
import { builderUpdateStatusText } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { TrayItemWidget } from './TrayItemWidget';
import { TrayWidget } from './TrayWidget';

import BuilderEngine from '../BuilderEngine';

import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';

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
  const [filterSelection, setFilterSelection] = React.useState('');
  const [searchterm, setSearchterm] = React.useState('');
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

  const updateTrayItems = (filterSelection: string, searchterm: string) =>
    JSON.parse(modules_list)
      .filter((m) => m['name'].startsWith(filterSelection) || filterSelection === '(all)')
      .filter(
        (m) => m['name'].toLowerCase().includes(searchterm.toLowerCase()) || searchterm === '',
      )
      .map((m) => (
        <TrayItemWidget
          key={hash(JSON.stringify(m))}
          model={m}
          name={m['name']}
          color={BuilderEngine.GetModuleTypeColor(m['type'])}
        />
      ));

  const [trayitems, setTrayitems] = React.useState(updateTrayItems('(all)', ''));
  React.useEffect(() => {
    setFilterSelection('(all)');
    setTrayitems(updateTrayItems('(all)', ''));
  }, [modules]);

  const onChangeOrgList = (event: SelectChangeEvent) => {
    setFilterSelection(event.target.value);
    setTrayitems(updateTrayItems(event.target.value, searchterm));
  };

  const onChangeSearchTerm = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchterm(event.target.value);
    setTrayitems(updateTrayItems(filterSelection, event.target.value));
  };

  // Extract unique organisations from the module names for a filter list
  const organisaton_list = JSON.parse(modules_list)
    .map((m) => m['name'].match(/\((.*?)\)/)[0]) // extract organisation name
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort(); // sort alphabetically
  organisaton_list.unshift('(all)'); // add "(all)" to the top of the list
  const organisaton_list_options = organisaton_list.map((m) => (
    <MenuItem key={m} value={m}>
      {m}
    </MenuItem>
  ));

  return (
    <>
      <TextField
        id="repo-searchterm"
        name="repo-searchterm"
        placeholder="Search"
        value={searchterm}
        onChange={onChangeSearchTerm}
        variant="outlined"
        size="small"
        fullWidth
      />

      <Select
        name="orglist"
        id="orglist"
        value={filterSelection}
        onChange={onChangeOrgList}
        size="small"
        fullWidth
      >
        {organisaton_list_options}
      </Select>

      <TrayWidget>{trayitems}</TrayWidget>
    </>
  );
};

export default RepoBrowser;
