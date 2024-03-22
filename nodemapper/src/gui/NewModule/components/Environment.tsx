import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import React from 'react';

const CondaSearch = () => {
  const Channels = () => {
    return (
      <IconButton>
        <TuneIcon />
      </IconButton>
    );
  };
  const Search = () => {
    return (
      <IconButton>
        <SearchIcon />
      </IconButton>
    );
  };

  const CondaPackages = () => {
    return (
      <DataGrid
        sx={{ width: '100%', height: '100%' }}
        rows={[]}
        columns={[]}
        hideFooter={true}
        columnHeaderHeight={0}
      ></DataGrid>
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
