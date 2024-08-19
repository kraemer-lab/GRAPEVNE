import { MenuItem } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { DropdownMenu, NestedMenuItem, useMenu } from '../components/DropdownMenu';

// https://storybook.js.org/docs/writing-stories#
const meta = {
  title: 'Menus/DropdownMenu',
  component: DropdownMenu,
  decorators: [
    (Story) => {
      // DropdownMenu provides the menu context
      return (
        <DropdownMenu label="Menu">
          <Story />
        </DropdownMenu>
      );
    },
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Template: Story = {
  render: () => {
    const { closeAllMenus } = useMenu(); // eslint-disable-line react-hooks/rules-of-hooks

    const itemClicked = (text: string) => {
      alert(text);
      closeAllMenus();
    };

    return (
      <>
        <MenuItem onClick={() => itemClicked('Clicked Standard Item (Level 1)')}>
          Standard Item (Level 1)
        </MenuItem>
        {[1, 2, 3].map((i) => (
          <NestedMenuItem key={i} label={`Nested Item ${i} (Level 1)`}>
            {[1, 2, 3].map((j) => (
              <NestedMenuItem key={j} label={`Nested Item ${j} (Level 2)`}>
                {[1, 2, 3].map((k) => (
                  <MenuItem key={k} onClick={() => itemClicked(`Selected item ${k} (Level 3)`)}>
                    Item {k} (Level 3)
                  </MenuItem>
                ))}
              </NestedMenuItem>
            ))}
          </NestedMenuItem>
        ))}
      </>
    );
  },
};
