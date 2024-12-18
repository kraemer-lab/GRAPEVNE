import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import React from 'react';

interface IItem {
  label: string;
  value: string;
}

interface IInputItem {
  id: string;
  type?: string;
  label: string;
  value: string;
  list: IItem[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  labelWidth: string;
}

const SelectItem = ({ id, type, label, value, list, onChange, labelWidth }: IInputItem) => {
  if (type === undefined) {
    type = 'text';
  }
  return (
    <Box
      style={{
        display: 'flex',
        gap: '10px',
        flexDirection: 'row',
      }}
    >
      <Box
        style={{
          width: labelWidth,
          textAlign: 'right',
          alignSelf: 'center',
        }}
      >
        <Typography variant="body1">{label}</Typography>
      </Box>
      <Select defaultValue={value} onChange={onChange} style={{ width: '100%' }} size="small">
        {list.map((item) => (
          <MenuItem value={item.value}>{item.label}</MenuItem>
        ))}
      </Select>
    </Box>
  );
};

export default SelectItem;
