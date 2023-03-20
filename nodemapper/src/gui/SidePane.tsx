import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { ReactSlidingPane } from 'react-sliding-pane'
import { displayCloseSettings } from '../redux/actions'
import SidePaneContent from './SidePaneContent'
import { useAppSelector, useAppDispatch } from '../redux/store/hooks'
import './SidePane.css'

function SidePane() {
  const showpane = useAppSelector(state => state.display.show_settings_panel);
  const nodeinfo = useAppSelector(state => state.display.nodeinfo);
  const [title, setTitle] = useState("")
  const [blocktype, setBlocktype] = useState("")
  
  useEffect(() => {
    if (nodeinfo !== "") {
      const json = JSON.parse(nodeinfo)
      setTitle(json.name)
      setBlocktype(json.type)
    }
  }, [nodeinfo])

  const dispatch = useAppDispatch();
  return (
    <ReactSlidingPane
      className="some-custom-class"
      overlayClassName="some-custom-overlay-class"
      from="left"
      width="33%"
      isOpen={showpane}
      title={title}
      subtitle={blocktype}
      onRequestClose={() => {
        // triggered on "<" on left top click or on click outside of pane
        dispatch(displayCloseSettings());
      }}
    >
    <SidePaneContent />
    </ReactSlidingPane>
  )
};

export default SidePane
