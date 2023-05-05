import React from 'react'
import Header from './Header'
import MainPanel from './MainPanel'

import './Runner.css'

// Layout for main window, including sliding-pane support
function Runner() {
  return (
  <>
    <div className="header">
    <Header />
    </div>

    <div className="main">
    <MainPanel />
    </div>
  </>
)}

export default Runner;
