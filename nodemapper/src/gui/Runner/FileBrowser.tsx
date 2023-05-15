import React from "react";
import FolderContents from "./FolderContents";

import { useAppDispatch } from "redux/store/hooks";
import { runnerLoadWorkflow } from "redux/actions";

import "./FileBrowser.css";

function FileBrowser() {
  const dispatch = useAppDispatch();
  const btnLoadWorkflow = () => {
    dispatch(runnerLoadWorkflow());
  };

  return (
    <div className="filebrowser">
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>
              <div style={{ textAlign: "left" }}>File Browser</div>
            </th>
            <th>
              <div style={{ textAlign: "right" }}>
                <button onClick={btnLoadWorkflow}>LOAD</button>
              </div>
            </th>
          </tr>
        </thead>
      </table>
      <FolderContents />
    </div>
  );
}

export default FileBrowser;
