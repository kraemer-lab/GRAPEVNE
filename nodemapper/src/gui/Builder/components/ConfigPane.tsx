import React from 'react';
import BuilderSettings from './BuilderSettings';
import NodeInfoRenderer from './NodeInfoRenderer';

export const ConfigPane: React.FC = () => {
  return (
    <>
      <NodeInfoRenderer />
      <BuilderSettings />
    </>
  );
};

export default ConfigPane;
