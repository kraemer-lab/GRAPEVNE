import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import React from 'react';

interface ISliderItem {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  valueLabelDisplay: 'auto' | 'on' | 'off';
  onChange: (e: Event, value: number | number[]) => void;
  labelWidth: string;
}

const SliderItem = ({
  id,
  label,
  value,
  min,
  max,
  step,
  valueLabelDisplay,
  onChange,
  labelWidth,
}: ISliderItem) => {
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
      <Slider
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        valueLabelDisplay={valueLabelDisplay}
        onChange={onChange}
        style={{ width: '100%' }}
      />
    </Box>
  );
};

export default SliderItem;
