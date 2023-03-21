import React from 'react'
import { Component, StrictMode, } from 'react'
import { connect } from 'react-redux'
import Header from './Header'
import MainPanel from './MainPanel'
import SidePane from './SidePane'

import './App.css'

// Layout for main window, including sliding-pane support
export default function App() {
  return (
  <StrictMode>

    <div className="header">
    <Header />
    </div>

    <div className="main">
    <MainPanel />
    </div>

  </StrictMode>
)}
