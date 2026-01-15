import { Button } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { DialogPrompt } from '../components/DialogPrompt';

// https://storybook.js.org/docs/writing-stories#
const meta = {
  title: 'Dialogs/Prompt',
  component: DialogPrompt,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof DialogPrompt>;

export default meta;
type Story = StoryObj<typeof DialogPrompt>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false); // eslint-disable-line react-hooks/rules-of-hooks
    const [value, setValue] = useState(''); // eslint-disable-line react-hooks/rules-of-hooks

    return (
      <>
        <Button onClick={() => setOpen(true)} variant="contained">
          Open Dialog
        </Button>
        <DialogPrompt
          open={open}
          title="Dialog Title"
          content="Dialog Content"
          value={value}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setValue(event.target.value);
          }}
          onCancel={() => {
            setOpen(false);
            alert('Clicked close');
          }}
          onConfirm={() => {
            setOpen(false);
            alert('Clicked confirm: ' + value);
          }}
        />
      </>
    );
  },
};
