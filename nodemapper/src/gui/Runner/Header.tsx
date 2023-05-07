import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { useAppSelector } from 'redux/store/hooks'
import { useAppDispatch } from 'redux/store/hooks'
import { displayZoomToFit } from 'redux/actions'
import { displayDeleteResults } from 'redux/actions'
import { runnerImportSnakefile } from 'redux/actions'
import { runnerLoadSnakefile } from 'redux/actions'
import { runnerBuildSnakefile } from 'redux/actions'
import { runnerLaunchSnakefile } from 'redux/actions'
import { runnerQueryJobStatus } from 'redux/actions'
import RunnerEngine from './RunnerEngine'
import "./Header.css"

function Header() {
  const [textEditGraph, setTextEditGraph] = useState("EDIT GRAPH: OFF");
  const graph_is_moveable = useAppSelector(state => state.display.graph_is_moveable);
  const dispatch = useAppDispatch();

  // Load Scene
  const btnLoadScene = () => {
    RunnerEngine.Instance.LoadScene()
  }

  // Save Scene
  const btnSaveScene = () => {
    RunnerEngine.Instance.SaveScene()
  }

  // Check (import) Snakefile
  const btnCheckSnakefile = () => {
    dispatch(runnerImportSnakefile())
  }

  // Build Snakefile
  const btnBuildSnakefile = () => {
    dispatch(runnerBuildSnakefile())
  }

  // Launch Snakefile
  const btnLaunchSnakefile = () => {
    dispatch(runnerLaunchSnakefile())
  }

  // Query job status
  const btnQueryJobStatus = () => {
    dispatch(runnerQueryJobStatus())
  }

  // Delete results
  const btnDeleteResults = () => {
    dispatch(displayDeleteResults())
  }

  // Zoom to fit
  const btnZoomToFit = () => {
    dispatch(displayZoomToFit())
  }

  // render
  return (
    <>
    <link href="http://fonts.googleapis.com/css?family=Oswald" rel="stylesheet" type="text/css"/>
    <div style={{fontSize: 18, marginLeft: 0}}>
      <button className="btn" onClick={btnLoadScene}>LOAD</button>
      <button className="btn" onClick={btnSaveScene}>SAVE</button>
      <button className="btn" onClick={btnCheckSnakefile}>CHECK SNAKEFILE</button>
      <button className="btn" onClick={btnBuildSnakefile}>BUILD SNAKEFILE</button>
      <button className="btn" onClick={btnLaunchSnakefile}>RUN</button>
      <button className="btn" onClick={btnQueryJobStatus}>CHECK STATUS</button>
      <button className="btn" onClick={btnDeleteResults}>DELETE RESULTS</button>
      <button className="btn" onClick={btnZoomToFit}>RESET VIEW</button>
    </div>
    </>
  )
}

export default Header;
