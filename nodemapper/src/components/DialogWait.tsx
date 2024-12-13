import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import React from 'react';

interface DialogWaitProps {
  open: boolean;
  text?: string;
}

export const DialogWait = ({ open, text }: DialogWaitProps) => {
  text = text || 'Please wait...';
  return (
    <Modal open={open} onClose={() => {}}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Box sx={{ alignItems: 'center', textAlign: 'center', background: 'white', p: 4 }}>
          <CircularProgress />
          <Box sx={{ height: 20 }} />
          <Typography variant="subtitle1" gutterBottom>
            {text}
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default DialogWait;
