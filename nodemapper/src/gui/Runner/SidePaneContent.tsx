import React from 'react'
import { useState, useEffect } from 'react'
import { useAppSelector } from 'redux/store/hooks'
import { useAppDispatch } from 'redux/store/hooks'
import { displayUpdateNodeInfo } from 'redux/actions/display'

import "./SidePaneContent.css"

function SidePaneContentComponent() {
  const nodeinfo = useAppSelector(state => state.display.nodeinfo);
  const dispatch = useAppDispatch();

  const updateCodeSnippet = () => {
    // TODO: sort out payload
    const payload = ""
    dispatch(displayUpdateNodeInfo(payload))
  }

  const [codesnippet, setCodesnippet] = useState("")

  useEffect(() => {
    if (nodeinfo === "") {
      setCodesnippet("")
    } else {
      const json = JSON.parse(nodeinfo)
      setCodesnippet(json.code)
    }
  }, [nodeinfo])

  return (
    <div>
    <textarea
      id="codesnippet" {...{rows: 15}}
      style={{width: "100%"}}
      value={codesnippet}
      onChange={()=>{}}  // eslint-disable-line @typescript-eslint/no-empty-function
    />
    {/*<button
      className="btn"
      style={{padding: "10px", float: "right"}}
      onClick={updateCodeSnippet}
      disabled={true}
    >SAVE</button>*/}
    </div>
  );
}

export default SidePaneContentComponent
