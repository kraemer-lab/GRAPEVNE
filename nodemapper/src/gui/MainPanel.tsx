import React from 'react'
import MainBody from './MainBody'
import SidePane from './SidePane'
import FileBrowser from './FileBrowser'

import "./MainPanel.css"

function MainPanel() {
  return (
    <>
    <div className="split left">
      <SidePane />
      <FileBrowser />
    </div>

    <div className="split right">
      <MainBody />
    </div>
    </>
  )
}

export default MainPanel;
