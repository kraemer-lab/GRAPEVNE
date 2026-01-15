import { Button } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { DialogWait } from '../components/DialogWait';

// https://storybook.js.org/docs/writing-stories#
const meta = {
  title: 'Dialogs/Wait',
  component: DialogWait,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof DialogWait>;

export default meta;
type Story = StoryObj<typeof DialogWait>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false); // eslint-disable-line react-hooks/rules-of-hooks
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="contained">
          Open Wait Dialog
        </Button>
        <DialogWait open={open} />
      </>
    );
  },
};

export const CustomMessage: Story = {
  render: () => {
    const [open, setOpen] = useState(false); // eslint-disable-line react-hooks/rules-of-hooks
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="contained">
          Open Wait Dialog
        </Button>
        <DialogWait open={open} text={'Custom message...'} />
      </>
    );
  },
};
