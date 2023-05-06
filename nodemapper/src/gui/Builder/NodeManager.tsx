import React from 'react'
import { BodyWidget } from './components/BodyWidget';
import Application from './Application';

function NodeManager() {
  const app = Application.Instance;
  const engine = app.engine;
  return (
    <BodyWidget engine={engine}/>
  )
}

export default NodeManager
