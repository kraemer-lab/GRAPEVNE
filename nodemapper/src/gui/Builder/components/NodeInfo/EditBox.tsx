import React from 'react';
import EasyEdit from 'react-easy-edit';
import { Types } from 'react-easy-edit';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { HighlightJSON } from './HighlightJSON';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const EditBoxDefaults = (props) => {
  return (
    <EasyEdit
      {...props}
      onHoverCssClass="string"
      style={{ cursor: 'pointer' }}
      saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
      cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
      saveOnBlur={true}
    />
  );
}

export const EditBoxText = (props) => {
  return (
    <EditBoxDefaults
      {...props}
      type={Types.TEXT}
    />
  );
}

export const EditBoxSelect = (props) => {
  return (
    <EditBoxDefaults
      {...props}
      type={Types.SELECT}
    />
  );
}

export const EditBoxBoolean = (props) => {
  return (
    <EditBoxDefaults
      {...props}
      type={Types.SELECT}
      onHoverCssClass="boolean"
      options={[
        { label: 'true', value: true },
        { label: 'false', value: false },
      ]}
    />
  );
}

interface IEditBoxArray {
  label: string;
  key: string;
  keylist: string[];
  json;
  setMenu: (value) => void;
  nodeid: string;
  nodecount: string;
}

export const EditBoxList = ({ label, key, keylist, json, setMenu, nodeid, nodecount }: IEditBoxArray) => {
  return (
    <TreeItem nodeId={nodecount} key={key} label={label}>
      <HighlightJSON
        keylist={[...keylist, key]}
        json={json}
        setMenu={setMenu}
        nodeid={nodeid}
      />
    </TreeItem>
  );
}
