import React from 'react'
import NodeManager from './NodeManager'
import SidePane from './SidePane'

import "./MainPanel.css"

function MainPanel() {
  return (
    <>
    <div className="split left">
      <SidePane />
    </div>

    <div className="split right">
      <NodeManager />
    </div>
    </>
  )
}

export default MainPanel;
