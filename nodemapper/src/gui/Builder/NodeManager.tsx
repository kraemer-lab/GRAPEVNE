import React from 'react';
import BuilderEngine from './BuilderEngine';
import { BodyWidget } from './components/BodyWidget';

const NodeManager = () => {
  // Link to singleton instance
  const app = BuilderEngine.Instance;

  return <BodyWidget />;
};

export default NodeManager;
