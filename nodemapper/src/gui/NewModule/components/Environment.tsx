import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React from 'react';
import {
  newmoduleEnvCondaSearch,
  newmoduleEnvCondaSearchUpdatePackageList,
  newmoduleUpdateConfig,
  newmoduleUpdateEnvCondaSearchChannels,
} from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const CondaSearch = () => {
  const [searchterm, setSearchterm] = React.useState('');
  const [showSettings, setShowSettings] = React.useState(false);
  const dispatch = useAppDispatch();
  const rows = useAppSelector((state) => state.newmodule.env.packagelist);
  const searching = useAppSelector((state) => state.newmodule.env.searching);
  const channels = useAppSelector((state) => state.newmodule.env.channels);
  const [editValue, setEditValue] = React.useState('');

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name' },
    { field: 'version', headerName: 'Version' },
    { field: 'build', headerName: 'Build' },
    { field: 'channel', headerName: 'Channel' },
  ];

  const setChannels = (newChannels: string[]) => {
    dispatch(newmoduleUpdateEnvCondaSearchChannels(newChannels));
  }
  
  const onEditChange = (value: string) => {
    setEditValue(value);
    if (value.endsWith('\n') || value.endsWith(' ')) {
      if (value.trim().endsWith(',') || value.trim().endsWith(';'))
        value = value.trim().slice(0, -1);
      if (!value) return;
      setChannels([...channels, value.trim()]);
      setEditValue('');
    }
  };
  
  const handleSearchClick = () => {
    if (searchterm === '') {
      dispatch(newmoduleEnvCondaSearchUpdatePackageList([]));
      return;
    }
    dispatch(
      newmoduleEnvCondaSearch({
        searchterm: searchterm,
        channels: channels,
      }),
    );
  };

  const handleShowSettings = () => {
    setShowSettings(!showSettings);
  }

  const handleSearchEdit = (value: string) => {
    if (value.endsWith('\n')) handleSearchClick();
    else setSearchterm(value);
  };

  const IconSettings = () => {
    return (
      <IconButton onClick={handleShowSettings}>
        <TuneIcon />
      </IconButton>
    );
  };

  const IconSearch = () => {
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

  const Settings = () => {
    const handleDelete = (channel: string) => {
      setChannels(channels.filter((c) => c !== channel));
    };

    return (
      <Paper
        sx={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'column',
          height: '100%',
          p: 1,
        }}
        elevation={3}
      >
        <Typography variant="subtitle1">Conda search settings</Typography>
        <Typography variant="subtitle2">Channels:</Typography>
        <TextField
          id="module-conda-channels"
          variant="outlined"
          value={editValue}
          multiline // Permits the newline character to be parsed in the input
          maxRows={1} // Restrict input visually to a single line
          onChange={(e) => onEditChange(e.target.value)}
          sx={{ width: '100%' }}
        />
        <Grid id="newmodule-conda-channels-container" container spacing={1}>
          {channels.length === 0 && (
            <Grid item>
              <Typography variant="body2" gutterBottom>
                No channels specified (using defaults)
              </Typography>
            </Grid>
          )}
          {channels.map((channel) => (
            <Grid item key={channel}>
              <Chip
                label={channel}
                color="primary"
                variant="outlined"
                onDelete={() => handleDelete(channel)}
              />
            </Grid>
          ))}
        </Grid>
        <Button
          variant="contained"
          onClick={handleShowSettings}
        >
          CLOSE
        </Button>
      </Paper>
    );
  }
  
  const SearchDialog = () => {
    return (
      <>
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
                <IconSearch />
                <IconSettings />
              </>
            ),
          }}
        />
        {searching && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
        <CondaPackages />
      </>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {(showSettings) ? <Settings /> : <SearchDialog />}
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
