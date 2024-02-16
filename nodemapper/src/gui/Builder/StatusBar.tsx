import React, { useState } from 'react';
import { useAppSelector } from 'redux/store/hooks';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const StatusBar: React.FC = () => {
  const [status, setStatus] = useState('');
  const statustext = useAppSelector((state) => state.builder.statustext);
  React.useEffect(() => {
    setStatus(statustext);
  }, [statustext]);
  return (
    <Box
      className="status-bar"
      style={{
        marginLeft: '10px',
      }}
    >
      <Typography variant="body2">
        {status ? status : <br />}
      </Typography>
    </Box>
  );
};

export default StatusBar;
