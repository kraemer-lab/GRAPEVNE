import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import React from 'react';

interface DialogPromptProps {
  open: boolean;
  title?: string;
  content: string;
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel?: () => void;
  onConfirm: () => void;
}

export const DialogPrompt: React.FC<DialogPromptProps> = ({
  open,
  title,
  content,
  value,
  onChange,
  onCancel,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
        <TextField
          id="dialog-input"
          value={value}
          onChange={onChange}
          sx={{ width: '100%' }}
        />
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

export default DialogPrompt;
