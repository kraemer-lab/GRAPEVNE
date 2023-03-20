import React from 'react'
import { useState, useEffect } from 'react'
import { useAppSelector } from '../redux/store/hooks'
import { useAppDispatch } from '../redux/store/hooks'
import { displayUpdateNodeInfo } from '../redux/actions/display'
import { useSelector } from 'react-redux'

import "./SidePaneContent.css"

function SidePaneContentComponent() {
  const nodeinfo = useAppSelector(state => state.display.nodeinfo);
  const dispatch = useAppDispatch();

  const updateCodeSnippet = () => {
	// TODO: sort out payload
	const payload = ""
	dispatch(displayUpdateNodeInfo(payload))
  }

  const [title, setTitle] = useState("")
  const [name, setName] = useState("")
  const [codesnippet, setCodesnippet] = useState("")
  
  useEffect(() => {
    if (nodeinfo !== "") {
      const json = JSON.parse(nodeinfo)
      setTitle(json.name)
      setName(json.name)
      setCodesnippet(json.code)
    }
  }, [nodeinfo])

  return (
    <div>
    <p>Description, configuration, environment, etc.</p>
    <br/>
    <p>Code snippet<br/>
    <textarea
      id="codesnippet" {...{rows: 10}}
      style={{width: "100%"}}
      value={codesnippet}
      onChange={()=>{}}
    />
    </p>
    <button
      className="btn"
      style={{padding: "10px", float: "right"}}
      onClick={updateCodeSnippet}
      disabled={true}
    >SAVE</button>
    </div>
  );
}

export default SidePaneContentComponent
