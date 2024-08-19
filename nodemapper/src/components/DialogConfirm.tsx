import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React from 'react';

interface DialogConfirmProps {
  open: boolean;
  title?: string;
  content: string;
  style?: 'warning' | 'info' | 'error' | 'success' | 'none' | 'default';
  onCancel?: () => void;
  onConfirm: () => void;
}

export const DialogConfirm: React.FC<DialogConfirmProps> = ({
  open,
  title,
  content,
  style,
  onCancel,
  onConfirm,
}) => {
  if (!style || style === 'default') {
    style = 'none';
  }
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogConfirm;
