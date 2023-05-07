import React from 'react'
import { useAppDispatch } from 'redux/store/hooks'
import { builderLoadNodemap } from 'redux/actions'
import { builderSaveNodemap } from 'redux/actions'
import { builderCompileToJson } from 'redux/actions'

function Header() {
  const dispatch = useAppDispatch();
  
  // Load nodemap from file
  const btnLoad = () => {
    dispatch(builderLoadNodemap())
  }
  
  // Save nodemap to file
  const btnSave = () => {
    dispatch(builderSaveNodemap())
  }

  // Build - compile config to workflow zip and download
  const btnBuild = () => {
    dispatch(builderCompileToJson())
  }

  return (
    <>
    <link href="http://fonts.googleapis.com/css?family=Oswald" rel="stylesheet" type="text/css"/>
    <div style={{fontSize: 18, marginLeft: 0}}>
      <button className="btn" onClick={btnLoad}>LOAD</button>
      <button className="btn" onClick={btnSave}>SAVE</button>
      <button className="btn" onClick={btnBuild}>BUILD</button>
    </div>
    </>
  )
}

export default Header
