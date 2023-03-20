import React from 'react'
import { Component, StrictMode, } from 'react'
import { connect } from 'react-redux'

import './App.css'
import Header from './Header'
import MainPanel from './MainPanel'
import SidePane from './SidePane'

// Layout for main window, including sliding-pane support
export default function App() {
  return (
  <StrictMode>

    <div id="header-panel" style={{height: "30px"}}>
	<Header />
    </div>

    <div id="main-panel">
    <MainPanel />
    </div>
    
	<div id="side-pane">
    <SidePane />
    </div>

  </StrictMode>
)};
