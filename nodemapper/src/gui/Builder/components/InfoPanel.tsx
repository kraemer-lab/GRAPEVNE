import React from "react";
import TerminalWindow from "./TerminalWindow";
import { useAppSelector } from "redux/store/hooks";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import 'react-tabs/style/react-tabs.css';

const InfoPanel = () => {
  const terminal_visible = useAppSelector(
    (state) => state.builder.terminal_visibile
  );
  return(
    <Tabs
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <TabList>
        <Tab>Log / Terminal</Tab>
      </TabList>

      <TabPanel
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
          }}
        >
          <TerminalWindow />
        </div>
      </TabPanel>

    </Tabs>
  );
}

export default InfoPanel;
