import React from 'react'
import NodeManager from './NodeManager'
import Footer from './Footer'

import "./MainBody.css"

function MainBody() {
  return (
    <>
    <div className="split top">
      <NodeManager />
    </div>

    <div className="split bottom">
      <Footer />
    </div>
    </>
  )
}

export default MainBody;
