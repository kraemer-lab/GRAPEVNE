import React from 'react'
import FolderContents from './FolderContents'
import { useAppDispatch } from '../redux/store/hooks'
import { nodemapLoadWorkflow } from '../redux/actions'

function FileBrowser() {

  const dispatch = useAppDispatch();
  const btnLoadWorkflow = () => {
    dispatch(nodemapLoadWorkflow())
  }

  return (
    <>
    <p>
    <table style={{width: "100%"}}>
      <tr>
        <th><div style={{textAlign: "left"}}>File Browser</div></th>
        <th><div style={{textAlign: "right"}}><button onClick={btnLoadWorkflow}>LOAD</button></div></th>
      </tr>
    </table>
    </p>
    <FolderContents />
    </>
  )
}

export default FileBrowser;
