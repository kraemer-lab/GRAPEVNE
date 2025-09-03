import { Button } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { DialogAlert } from '../components/DialogAlert';

// https://storybook.js.org/docs/writing-stories#
const meta = {
  title: 'Dialogs/Alert',
  component: DialogAlert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof DialogAlert>;

export default meta;
type Story = StoryObj<typeof DialogAlert>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false); // eslint-disable-line react-hooks/rules-of-hooks
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="contained">
          Open Dialog
        </Button>
        <DialogAlert
          open={open}
          title="Dialog Title"
          content="Dialog Content"
          onClose={() => {
            setOpen(false);
            alert('Clicked confirm');
          }}
        />
      </>
    );
  },
};
