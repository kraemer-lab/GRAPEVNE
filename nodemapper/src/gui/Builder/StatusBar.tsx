import React, { useState } from 'react';
import { useAppSelector } from 'redux/store/hooks';
import Box from '@mui/material/Box';

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
        fontSize: 14,
        marginLeft: '10px',
      }}
    >
      {status ? status : <br />}
    </Box>
  );
};

export default StatusBar;
