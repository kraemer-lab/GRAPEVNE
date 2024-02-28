import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import React from 'react';
import Header from './Header';
import MainBody from './MainBody';
import StatusBar from './StatusBar';

const Builder = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexFlow: 'column',
      }}
    >
      <Paper sx={{ flex: '0 1 auto', p: 1 }} square={true}>
        <Header />
      </Paper>
      <Divider />
      <Paper sx={{ flex: '1 1 auto', overflowY: 'auto' }} square={true}>
        <MainBody />
      </Paper>
      <Divider />
      <Paper square={true}>
        <StatusBar />
      </Paper>
    </Box>
  );
};

export default Builder;
