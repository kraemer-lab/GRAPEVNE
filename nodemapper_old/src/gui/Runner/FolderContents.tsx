import React from "react";

import { useEffect } from "react";
import { useState } from "react";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";

import { displayGetFolderInfo } from "redux/actions/display";
import { displaySetFolder } from "redux/actions/display";
import { displaySetFilename } from "redux/actions/display";

import { runnerLoadSnakefile } from "redux/actions/runner";

import "./FolderContents.css";

const FolderContents = () => {
  const folderinfo = useAppSelector((state) => state.display.folderinfo);
  const [items, setItems] = useState([]);
  const dispatch = useAppDispatch();

  let old_folder = "";
  useEffect(() => {
    const js = JSON.parse(folderinfo);
    if (old_folder !== js.foldername) {
      old_folder = js.foldername;
      dispatch(displayGetFolderInfo());
    }
    const list = js.contents;
    list.unshift({ name: "..", isdir: true });
    setItems(js.contents);
  }, [folderinfo]);

  const selectFile = (item) => {
    const newpath = JSON.parse(folderinfo).foldername + "/" + item.name;
    if (item.isdir) {
      dispatch(displaySetFolder(newpath));
    } else {
      dispatch(displaySetFilename(newpath));
      dispatch(runnerLoadSnakefile(newpath));
    }
  };
  const listitems = items.map((item) => (
    <li key={item.name}>
      <button className="button" onClick={() => selectFile(item)}>
        {item.name}
      </button>
    </li>
  ));

  return (
    <>
      <ul>{listitems}</ul>
    </>
  );
};

export default FolderContents;
