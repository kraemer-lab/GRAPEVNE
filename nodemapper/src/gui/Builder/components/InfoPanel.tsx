import React from 'react';
import { useAppSelector } from 'redux/store/hooks';
import Logger from './Logger';

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
      {value === index && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            p: 0,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
};

const tabProps = (index: number) => {
  return {
    id: `infopanel-tab-${index}`,
    'aria-controls': `infopanel-tabpanel-${index}`,
  };
};

const InfoPanel = () => {
  const terminal_visible = useAppSelector((state) => state.builder.terminal_visibile);

  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexFlow: 'column', width: '100%', height: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="footer tabs">
          <Tab label="Log" {...tabProps(0)} />
        </Tabs>
      </Box>
      <Box sx={{ alignItems: 'stretch', height: '100%' }}>
        <TabPanel value={value} index={0}>
          <Logger />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default InfoPanel;
