import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React from 'react';
import {
  newmoduleEnvCondaSearch,
  newmoduleEnvCondaSearchUpdatePackageList,
  newmoduleUpdateConfig,
} from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const CondaSearch = () => {
  const [searchterm, setSearchterm] = React.useState('');
  const dispatch = useAppDispatch();
  const rows = useAppSelector((state) => state.newmodule.env.packagelist);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name' },
    { field: 'version', headerName: 'Version' },
    { field: 'build', headerName: 'Build' },
    { field: 'channel', headerName: 'Channel' },
  ];

  const handleSearchClick = () => {
    if (searchterm === '') {
      dispatch(newmoduleEnvCondaSearchUpdatePackageList([]));
      return;
    }
    dispatch(
      newmoduleEnvCondaSearch({
        searchterm: searchterm,
      }),
    );
  };

  const handleSearchEdit = (value: string) => {
    if (value.endsWith('\n')) handleSearchClick();
    else setSearchterm(value);
  };

  const Channels = () => {
    return (
      <IconButton>
        <TuneIcon />
      </IconButton>
    );
  };

  const Search = () => {
    return (
      <IconButton onClick={handleSearchClick}>
        <SearchIcon />
      </IconButton>
    );
  };

  const CondaPackages = () => {
    return (
      <DataGrid
        sx={{ width: '100%', height: '100%' }}
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: { paginationModel: { pageSize: 5 } },
        }}
      />
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <TextField
        id="module-conda-search"
        label="Search for Conda packages"
        variant="outlined"
        sx={{ width: '100%' }}
        //multiline // Permits the newline character to be parsed in the input
        //maxRows={1} // Restrict input visually to a single line
        value={searchterm}
        onChange={(e) => handleSearchEdit(e.target.value)}
        InputProps={{
          endAdornment: (
            <>
              <Search />
              <Channels />
            </>
          ),
        }}
      />
      <CondaPackages />
    </Box>
  );
};

const ModuleEnvironment = () => {
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const handleEnvChange = (e: any) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.env = e.target.value as string;
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Environment
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: 1 }}>
        <TextField
          id="module-environment"
          label="Conda configuration"
          variant="outlined"
          value={moduleConfig.env}
          onChange={handleEnvChange}
          multiline
          rows={8}
          sx={{ width: '100%' }}
        />
        <CondaSearch />
      </Box>
    </Box>
  );
};

export default ModuleEnvironment;
