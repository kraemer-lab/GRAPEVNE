import React from "react";
import BuilderSettings from "./BuilderSettings";
import NodeInfoRenderer from "./NodeInfoRenderer";
import { useAppSelector } from "redux/store/hooks";
import { ConfigPaneDisplay } from "redux/types";

export const ConfigPane: React.FC = () => {
  const configPaneDisplay = useAppSelector(
    (state) => state.builder.config_pane_display,
  );

  switch (configPaneDisplay) {
    case ConfigPaneDisplay.Node:
      return <NodeInfoRenderer />;
    case ConfigPaneDisplay.Settings:
      return <BuilderSettings />;
    default:
      return <></>;
  }
};

export default ConfigPane;
