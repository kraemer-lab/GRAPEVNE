import React from 'react'
import BuilderEngine from './BuilderEngine'
import { useAppDispatch } from 'redux/store/hooks'
import { builderLoadNodemap } from 'redux/actions'
import { builderSaveNodemap } from 'redux/actions'
import { builderCompileToJson } from 'redux/actions'

function Header() {
  const dispatch = useAppDispatch();
  
  // Load nodemap from file
  const btnLoadScene = () => {
    BuilderEngine.Instance.LoadScene();
  }
  
  // Save nodemap to file
  const btnSaveScene = () => {
    BuilderEngine.Instance.SaveScene();
  }

  // Build - compile config to workflow zip and download
  const btnBuild = () => {
    dispatch(builderCompileToJson())
  }
  
  // Distribute model (visual)
  const btnArrange = () => {
    BuilderEngine.Instance.RedistributeModel();
  }

  return (
    <>
    <link href="http://fonts.googleapis.com/css?family=Oswald" rel="stylesheet" type="text/css"/>
    <div style={{fontSize: 18, marginLeft: 0}}>
      <button className="btn" onClick={btnLoadScene}>LOAD</button>
      <button className="btn" onClick={btnSaveScene}>SAVE</button>
      <button className="btn" onClick={btnBuild}>BUILD</button>
      <button className="btn" onClick={btnArrange}>ARRANGE</button>
    </div>
    </>
  )
}

export default Header
