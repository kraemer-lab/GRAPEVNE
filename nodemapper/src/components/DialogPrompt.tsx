import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import React from 'react';

export interface DialogPromptProps {
  open: boolean;
  title?: string;
  content: string;
  value: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel?: () => void;
  onConfirm: () => void;
}

export const DialogPrompt: React.FC<DialogPromptProps> = ({
  open,
  title,
  content,
  value,
  inputRef,
  onChange,
  onCancel,
  onConfirm,
}) => {
  // Defaults
  inputRef = inputRef || React.createRef<HTMLInputElement>();
  onChange = onChange || (() => {});
  onCancel = onCancel || (() => {});

  return (
    <Dialog open={open} onClose={onCancel} disableEnforceFocus>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
        <TextField
          id="dialog-input"
          value={value}
          inputRef={inputRef}
          onChange={onChange}
          variant="outlined"
          fullWidth
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button onClick={() => onConfirm()} color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogPrompt;
