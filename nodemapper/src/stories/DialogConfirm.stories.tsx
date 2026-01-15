import { Button } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { DialogConfirm } from '../components/DialogConfirm';

const lorum_ipsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vitae laoreet justo. Nunc sodales erat et luctus convallis. Vestibulum maximus purus eleifend lorem tincidunt venenatis. Maecenas luctus porta erat, eget maximus nisl sollicitudin a. Aenean neque purus, auctor eget suscipit in, fermentum quis nulla. Vestibulum sagittis, urna sit amet pellentesque tincidunt, nisl ligula dapibus sem, vitae vulputate nisi ligula eget lectus. Integer pellentesque efficitur pretium. Aenean viverra malesuada tellus, vel aliquam erat fermentum sit amet. Phasellus pharetra sollicitudin erat ac tristique. Mauris nulla est, aliquet at nisi nec, maximus interdum nibh. Suspendisse convallis nibh at leo lobortis, eu consequat velit pellentesque. Nulla semper turpis vel semper tristique. Donec faucibus, turpis sit amet condimentum semper, tellus dolor vehicula nulla, at interdum nisi risus id purus. Maecenas ac orci egestas, bibendum ipsum sed, dignissim urna.';

// https://storybook.js.org/docs/writing-stories#
const meta = {
  title: 'Dialogs/Confirm',
  component: DialogConfirm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof DialogConfirm>;

export default meta;
type Story = StoryObj<typeof DialogConfirm>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false); // eslint-disable-line react-hooks/rules-of-hooks
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="contained">
          Open Dialog
        </Button>
        <DialogConfirm
          open={open}
          title="Dialog Title"
          content="Dialog Content"
          onCancel={() => {
            setOpen(false);
            alert('Clicked close');
          }}
          onConfirm={() => {
            setOpen(false);
            alert('Clicked confirm');
          }}
        />
      </>
    );
  },
};

export const LoremIpsum: Story = {
  render: () => {
    const [open, setOpen] = useState(false); // eslint-disable-line react-hooks/rules-of-hooks
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="contained">
          Open Dialog
        </Button>
        <DialogConfirm
          open={open}
          title="Dialog Title"
          content={lorum_ipsum}
          onCancel={() => {
            setOpen(false);
            alert('Clicked close');
          }}
          onConfirm={() => {
            setOpen(false);
            alert('Clicked confirm');
          }}
        />
      </>
    );
  },
};
