import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

interface IInputItem {
  id: string;
  type?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  labelWidth: string;
}

const InputItem = ({ id, type, label, value, onChange, labelWidth }: IInputItem) => {
  if (type === undefined) {
    type = 'text';
  }
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '10px',
        flexDirection: 'row',
      }}
    >
      <Box
        sx={{
          width: labelWidth,
          textAlign: 'right',
          alignSelf: 'center',
        }}
      >
        <Typography variant="body1">{label}</Typography>
      </Box>
      <TextField
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        style={{ width: '100%' }}
        size="small"
      />
    </Box>
  );
};

export default InputItem;
