import { FitAddon } from '@xterm/addon-fit';
import React from 'react';
import { Terminal } from 'xterm';
import Logger from './Logger';
import TerminalWindow from './TerminalWindow';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="infopanel-tabpanel"
      hidden={value !== index}
      id={`infopanel-tabpanel-${index}`}
      aria-labelledby={`infopanel-tab-${index}`}
      sx={{
        height: '100%',
        width: '100%',
      }}
      {...other}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          p: 0,
          background: value === 1 ? 'black' : 'default',
        }}
        hidden={value !== index}
      >
        {children}
      </Box>
    </Box>
  );
};

const tabProps = (index: number) => {
  return {
    id: `infopanel-tab-${index}`,
    'aria-controls': `infopanel-tabpanel-${index}`,
  };
};

interface IInfoPanel {
  terminal: Terminal;
  fitAddon: FitAddon;
}

const InfoPanel = (props: IInfoPanel) => {
  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    setTimeout(() => {
      props.fitAddon.fit();
    }, 10); // Near-instant resize
    setTimeout(() => {
      props.fitAddon.fit();
    }, 100); // Slower resize
  };

  return (
    <Box sx={{ display: 'flex', flexFlow: 'column', width: '100%', height: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="footer tabs">
          <Tab label="Log" {...tabProps(0)} />
          <Tab label="Terminal" {...tabProps(1)} />
        </Tabs>
      </Box>
      <Box sx={{ alignItems: 'stretch', height: '100%', overflowY: 'hidden' }}>
        <TabPanel value={value} index={0}>
          <Logger />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <TerminalWindow terminal={props.terminal} />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default InfoPanel;
