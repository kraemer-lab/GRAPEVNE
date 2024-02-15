import React from 'react';
import { useAppSelector } from 'redux/store/hooks';
import { ConfigPaneDisplay } from 'redux/types';
import BuilderSettings from './BuilderSettings';
import NodeInfoRenderer from './NodeInfoRenderer';

export const ConfigPane: React.FC = () => {
  const configPaneDisplay = useAppSelector((state) => state.builder.config_pane_display);

  switch (configPaneDisplay) {
    case ConfigPaneDisplay.Node:
      return <NodeInfoRenderer />;
    case ConfigPaneDisplay.Settings:
      return <BuilderSettings />;
    default:
      return null;
  }
};

export default ConfigPane;
