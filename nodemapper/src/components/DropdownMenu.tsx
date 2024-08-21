import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import React, { createContext, useContext } from 'react';

interface MenuProviderProps {
  closeAllMenus: () => void;
}

export const MenuContext = createContext<MenuProviderProps | undefined>(undefined);

export interface NestedMenuItemProps extends React.ComponentProps<typeof MenuItem> {
  label: string;
  children?: React.ReactNode;
}

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

export const NestedMenuItem = ({ label, children, ...props }: NestedMenuItemProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuClick = (event: React.MouseEvent<HTMLLIElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      {/* Menu item */}
      <MenuItem onClick={menuClick} {...props}>
        {label}
        <Box style={{ flexGrow: 1 }} />
        <ArrowRightIcon />
      </MenuItem>

      {/* Sub-menu */}
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={() => {
          setAnchorEl(null);
        }}
        disableAutoFocusItem
        autoFocus={false}
      >
        <Box sx={{ minWidth: 150 }}>{children}</Box>
      </Menu>
    </>
  );
};

export interface DropdownMenuProps extends React.ComponentProps<typeof Button> {
  label: string;
  children?: React.ReactNode;
}

export const DropdownMenu = ({ label, children, ...props }: DropdownMenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <MenuContext.Provider
      value={{
        closeAllMenus: () => {
          setAnchorEl(null);
        },
      }}
    >
      {/* Menu button */}
      <Button
        aria-controls={open ? 'graph-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={onClick}
        endIcon={<KeyboardArrowDownIcon />}
        variant="contained"
        {...props}
      >
        {label}
      </Button>

      {/* Drop-down menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => {
          setAnchorEl(null);
        }}
        MenuListProps={{
          'aria-labelledby': 'dropdown',
        }}
      >
        <Box sx={{ minWidth: 150 }}>{children}</Box>
      </Menu>
    </MenuContext.Provider>
  );
};
