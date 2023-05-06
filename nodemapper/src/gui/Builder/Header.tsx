import React from 'react'
import { useAppDispatch } from 'redux/store/hooks'
import { builderCompileToJson } from 'redux/actions'

function Header() {
  const dispatch = useAppDispatch();

  const btnBuild = () => {
    dispatch(builderCompileToJson())
  }

  return (
    <>
    <link href="http://fonts.googleapis.com/css?family=Oswald" rel="stylesheet" type="text/css"/>
    <div style={{fontSize: 18, marginLeft: 0}}>
      <button className="btn" onClick={btnBuild}>BUILD</button>
    </div>
    </>
  )
}

export default Header
