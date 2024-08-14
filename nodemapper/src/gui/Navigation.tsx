import AddBox from '@mui/icons-material/AddBox';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BuildIcon from '@mui/icons-material/Schema';
import SettingsIcon from '@mui/icons-material/Settings';
import VneyardIcon from '@mui/icons-material/Storage';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { CSSObject, Theme, styled } from '@mui/material/styles';
import * as React from 'react';
import { builderSetTerminalMounted } from 'redux/actions';
import { useAppDispatch } from 'redux/store/hooks';
import Builder from './Builder/Builder';
import Vneyard from './Vneyard/Vneyard';
import ModuleEditor from './ModuleEditor/ModuleEditor';
import Settings from './Settings/Settings';

const drawerWidth = 200;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const NavItem = ({
  id,
  text,
  Icon,
  open,
  onClick,
}: {
  id: string;
  text: string;
  Icon;
  open: boolean;
  onClick;
}) => {
  return (
    <ListItem key={text} disablePadding sx={{ display: 'block' }}>
      <ListItemButton
        id={id}
        sx={{
          minHeight: 48,
          justifyContent: open ? 'initial' : 'center',
          px: 2.5,
        }}
        onClick={(e) => onClick(e, text)}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : 'auto',
            justifyContent: 'center',
          }}
        >
          <Icon />
        </ListItemIcon>
        <ListItemText primary={text} sx={{ opacity: open ? 1 : 0 }} />
      </ListItemButton>
    </ListItem>
  );
};

const Navigation = () => {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState('Canvas');
  const dispatch = useAppDispatch();

  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    text: string,
  ) => {
    setSelected(text);
    dispatch(builderSetTerminalMounted(false)); // permit terminal to reload
  };

  const ContentPicker = () => {
    switch (selected) {
      case 'Canvas':
        return <Builder />;
      case 'Vneyard':
        return <Vneyard />;
      case 'Settings':
        return <Settings />;
      case 'Module Editor':
        return <ModuleEditor />;
      default:
        console.error('Unknown menu item selected:', selected);
        return <Builder />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      <CssBaseline />
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={() => setOpen(!open)}>
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <NavItem
            id="btnSidenavBuilder"
            text="Canvas"
            Icon={BuildIcon}
            open={open}
            onClick={handleListItemClick}
          />
        </List>
        <Divider />
        <List>
          <NavItem
            id="btnSidenavVneyard"
            text="Vneyard"
            Icon={VneyardIcon}
            open={open}
            onClick={handleListItemClick}
          />
        </List>
        <Divider />
        <List>
          <NavItem
            id="btnSidenavModuleEditor"
            text="Module Editor"
            Icon={AddBox}
            open={open}
            onClick={handleListItemClick}
          />
        </List>
        <Divider />
        <List>
          <NavItem
            id="btnSidenavSettings"
            text="Settings"
            Icon={SettingsIcon}
            open={open}
            onClick={handleListItemClick}
          />
        </List>
        <Divider />
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
        }}
      >
        <ContentPicker />
      </Box>
    </Box>
  );
};

export default Navigation;
