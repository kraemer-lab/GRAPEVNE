import React from "react";
import TerminalWindow from "./TerminalWindow";
import Logger from "./Logger";
import { useAppSelector } from "redux/store/hooks";

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      style={{
        width: '100%',
        height: '100%',
      }}
      {...other}
    >
      {value === index && (
        <Box
          sx={{ p: 3 }}
      style={{
        width: '100%',
        height: '100%',
      }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

const tabProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

const InfoPanel = () => {
  const terminal_visible = useAppSelector(
    (state) => state.builder.terminal_visibile,
  );

  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="footer tabs">
          <Tab label="Log" {...tabProps(0)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Logger />
      </TabPanel>
    </Box>
  );
};

export default InfoPanel;
