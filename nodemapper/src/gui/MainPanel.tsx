import React from 'react'
import MainBody from './MainBody'
import SidePane from './SidePane'

import "./MainPanel.css"

function MainPanel() {
  return (
    <>
    <div className="split left">
      <SidePane />
    </div>

    <div className="split right">
      <MainBody />
    </div>
    </>
  )
}

export default MainPanel;
