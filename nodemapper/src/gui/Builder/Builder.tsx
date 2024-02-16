import React from 'react';
import Header from './Header';
import NodeManager from './NodeManager';
import StatusBar from './StatusBar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

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
      <Box sx={{ flex: '0 1 auto', p: 1 }}>
        <Header />
      </Box>
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 1 }}>
        <NodeManager />
      </Box>
      <Box>
        <StatusBar />
      </Box>
    </Box>
  );
};

export default Builder;
