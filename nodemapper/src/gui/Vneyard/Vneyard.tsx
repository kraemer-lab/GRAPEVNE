import React from 'react';
import { Box } from '@mui/material';

const Vineyard = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100vh',
      }}
    >
      <iframe
        src="https://kraemer-lab.github.io/vneyard/"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </Box>
  );
};

export default Vineyard;
