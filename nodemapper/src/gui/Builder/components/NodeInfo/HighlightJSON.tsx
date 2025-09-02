import React from 'react';

import { builderUpdateNodeInfoKey } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { getNodeById, getNodeByName } from './../Flow';
import {
  EditBoxBoolean,
  EditBoxFile,
  EditBoxFolder,
  EditBoxList,
  EditBoxSelect,
  EditBoxText,
} from './EditBox';

import { Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import type {} from '@mui/x-tree-view/themeAugmentation';

import Box from '@mui/material/Box';

const TypoKey = (props) => <Typography variant="key" {...props} />;

const protectedNames = [
  'input_namespace',
  'ports',
  'output_namespace',
  'namespace',
  'snakefile',
  'docstring',
];
const simple_types = ['string', 'number', 'boolean'];

export const lookupKey = (json, keylist: string[], key: string) => {
  // If key is the empty string, return the last key in the keylist
  if (key === '') {
    key = keylist[keylist.length - 1];
    keylist = keylist.slice(0, keylist.length - 1);
  }
  for (let i = 0; i < keylist.length; i++) {
    if (json[keylist[i]] === undefined) return undefined;
    json = json[keylist[i]];
  }
  if (json[key] === undefined) return undefined;
  return json[key];
};

const lookupKeyGlobal = (
  json,
  node_name: string,
  keylist: string[],
  key: string,
  lookup_count = 0,
) => {
  // Stop infinite recursion
  if (lookup_count > 100) {
    return undefined;
  }

  // If key is the empty string, return the last key in the keylist
  if (key === '') {
    if (keylist.length === 0) {
      return undefined;
    }
    key = keylist[keylist.length - 1];
    keylist = keylist.slice(0, keylist.length - 1);
  }

  // First, determine which module to look up the key in
  const nodes = useAppSelector((state) => state.builder.nodes);
  const node = getNodeByName(node_name, nodes);
  if (node === undefined) {
    return undefined;
  }

  // Obtain the module's config
  const config = node?.data?.config?.config ?? null;
  if (config === null) {
    return undefined;
  }
  const value = lookupKey(config, keylist, key);
  const metadata = lookupKey(config, keylist, ':' + key);

  // If the key is linked to another parameter, follow the link
  if (metadata !== undefined && metadata['link'] !== undefined) {
    let link_from = metadata['link'];
    const link_node = link_from[0];
    link_from = link_from.slice(1, link_from.length);
    return lookupKeyGlobal(json, link_node, link_from, '', lookup_count + 1);
  } else {
    // Otherwise, return the simple value
    return value;
  }
};

export const checkParameter_IsModuleRoot = (value) => {
  // Parameter is a module root if it contains a 'snakefile' field
  if (value === undefined) return false;
  if (Object.keys(value).includes('snakefile')) return true;
  return false;
};

export const checkParameter_IsInModuleConfigLayer = (node, keylist) => {
  // Is the parameters parent a module root?
  if (node === undefined || node === null) return false;
  let jsonObj = JSON.parse(JSON.stringify(node))['data']['config']['config'];
  for (let i = 0; i < keylist.length; i++) {
    jsonObj = jsonObj[keylist[i]];
    if (jsonObj === undefined) return false;
  }
  if (checkParameter_IsModuleRoot(jsonObj)) return true;
  return false;
};

export const checkParameter_IsInModuleConfig = (node, keylist) => {
  // Is the parameters grandparent a module config layer?
  if (node === undefined || node === null) return false;
  let jsonObj = JSON.parse(JSON.stringify(node))['data']['config']['config'];
  for (let i = 0; i < keylist.length - 1; i++) {
    jsonObj = jsonObj[keylist[i]];
    if (jsonObj === undefined) return false;
  }
  if (checkParameter_IsModuleRoot(jsonObj)) return true;
  return false;
};

let nodecount = 0;

interface IHighlightJSONProps {
  keylist: string[];
  json: string;
  setMenu: (state) => void;
  nodeid: string;
}

// Recursive function to render the JSON tree
export const HighlightJSON = ({ keylist, json, setMenu, nodeid }: IHighlightJSONProps) => {
  const nodes = useAppSelector((state) => state.builder.nodes);
  const display_module_settings = useAppSelector((state) => state.settings.display_module_settings);
  const hide_params_in_module_info = useAppSelector(
    (state) => state.settings.hide_params_in_module_info,
  );
  const dispatch = useAppDispatch();
  // Isolate current branch in the json tree (indexed by keylist)
  let jsonObj = json;
  for (let i = 0; i < keylist.length; i++) {
    jsonObj = jsonObj[keylist[i]];
  }
  // Map the JSON sub-fields to a list of rendered elements
  const fieldlist = Object.keys(jsonObj).map((key) => {
    let value = jsonObj[key];
    let valueType: string = typeof value;
    let isSimpleValue = simple_types.includes(valueType) || !value;
    if (isSimpleValue && valueType === 'object') {
      valueType = 'null' as undefined;
    }
    // If the value is an array of simple types, treat it as an (editable) list
    if (Array.isArray(value) && value.map((v) => typeof v).every((v) => simple_types.includes(v))) {
      valueType = 'list';
    }
    let isProtectedValue = false;
    if (isSimpleValue) {
      isProtectedValue = protectedNames.includes(key);
    }
    if (isProtectedValue && valueType === 'null') {
      value = '(null)';
      valueType = null;
    }
    const isHiddenValue =
      !display_module_settings && (protectedNames.includes(key) || key.startsWith(':'));
    if (isHiddenValue) {
      return <Box key={key}></Box>;
    }

    // Check whether parameter has a corresponding metadata entry
    const metadata = lookupKey(json, keylist, ':' + key);
    const valueOptions = [];
    let isParameterConnected = false;
    let parameterValue = '(link)';
    if (metadata !== undefined) {
      // Determine the type of the parameter
      if (typeof metadata['type'] === 'string') {
        switch (metadata['type'].toLowerCase()) {
          case 'select':
            valueType = 'select';
            for (const option of metadata['options']) {
              valueOptions.push({
                label: option,
                value: option,
              });
            }
            break;
          case 'file':
            valueType = 'file';
            isSimpleValue = true; // Fake simple value for visualisation
            break;
          case 'folder':
            valueType = 'folder';
            isSimpleValue = true; // Fake simple value for visualisation
            break;
          default:
            console.log('Unknown parameter type specified: ', metadata['type']);
        }
      }
      // Check whether the parameter is linked to another parameter
      if (metadata['link'] !== undefined) {
        let link_from = metadata['link'];
        const link_node = link_from[0];
        link_from = link_from.slice(1, link_from.length);
        parameterValue = lookupKeyGlobal(json, link_node, link_from, '');
        if (parameterValue === undefined) parameterValue = '(linked value is undefined)';
        if (parameterValue === '') parameterValue = '(linked value is empty)';
        isParameterConnected = true;
      }
    }

    // Determine whether parameter is connectable - simple values only for now
    const canConnectParameter = isSimpleValue;

    // If the key is a module root, substitute the module 'name' field as the label
    let label = key;
    const isModuleRoot = checkParameter_IsModuleRoot(value);
    if (isModuleRoot && !display_module_settings) {
      if (jsonObj[key].name !== undefined) {
        label = jsonObj[key].name;
      }
    }

    // If the key is a module config, skip rendering of the key (but render children)
    const node = getNodeById(nodeid, nodes);
    const isInModuleConfigLayer = checkParameter_IsInModuleConfigLayer(node, keylist);
    if (isInModuleConfigLayer && !display_module_settings) {
      // Of the parameters in the module config layer, continue rendering only the
      // 'config' children, which contains the actual parameters
      if (key !== 'config') {
        return null;
      } else {
        return (
          <HighlightJSON
            key={(nodecount++).toString()}
            keylist={[...keylist, key]}
            json={json}
            setMenu={setMenu}
            nodeid={nodeid}
          />
        );
      }
    }

    // If 'param' is a module config, skip rendering of the key (but render children)
    const isInModuleConfig = checkParameter_IsInModuleConfig(node, keylist);
    if (
      key === 'params' &&
      hide_params_in_module_info &&
      isInModuleConfig &&
      !display_module_settings
    ) {
      return (
        <HighlightJSON
          key={(nodecount++).toString()}
          keylist={[...keylist, key]}
          json={json}
          setMenu={setMenu}
          nodeid={nodeid}
        />
      );
    }

    // Callback to update field in central state (triggers re-render)
    const setValue = (value) => {
      dispatch(builderUpdateNodeInfoKey({ keys: [...keylist, key], value: value }));
    };

    // Callback to connect parameters between modules
    const connectParameter = () => {
      console.log('Connect parameter: ', key);
      setMenu({
        id: nodeid,
        keylist: keylist,
        keyitem: key,
        top: 100,
        bottom: 100,
        left: 100,
        right: 100,
        onclose: () => {
          setMenu(null);
        },
      });
    };

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'default',
          p: 0.2,
          whiteSpace: 'nowrap',
          overflowX: 'hidden',
        }}
        key={key}
        className="line"
      >
        {isSimpleValue ? (
          <Grid container spacing={0} p={0} sx={{ alignItems: 'center' }}>
            <Grid item xs={4} sx={{ overflowX: 'hidden' }}>
              <TypoKey className="key">{label}:</TypoKey>
            </Grid>
            <Grid item xs={8}>
              {valueType === 'boolean' ? (
                <EditBoxBoolean
                  value={value ? 'true' : 'false'}
                  onSave={(value) => {
                    setValue(value === 'true');
                  }}
                />
              ) : valueType === 'select' ? (
                <EditBoxSelect value={value} options={valueOptions} onSave={setValue} />
              ) : valueType === 'file' ? (
                <EditBoxFile
                  id={['nodeinfo', nodeid, ...keylist, key].join('-')}
                  value={value['Folder'] + '/' + value['Filename']}
                  valueType={valueType}
                  onSave={setValue}
                  canConnectParameter={canConnectParameter}
                  connectParameter={connectParameter}
                  allowEdit={!isParameterConnected && !isProtectedValue}
                />
              ) : valueType === 'folder' ? (
                <EditBoxFolder
                  id={['nodeinfo', nodeid, ...keylist, key].join('-')}
                  value={value}
                  valueType={valueType}
                  onSave={setValue}
                  canConnectParameter={canConnectParameter}
                  connectParameter={connectParameter}
                  allowEdit={!isParameterConnected && !isProtectedValue}
                />
              ) : (
                <EditBoxText
                  id={['nodeinfo', nodeid, ...keylist, key].join('-')}
                  value={isParameterConnected ? parameterValue : value}
                  valueType={valueType}
                  onSave={setValue}
                  canConnectParameter={canConnectParameter}
                  connectParameter={connectParameter}
                  allowEdit={!isParameterConnected && !isProtectedValue}
                />
              )}
            </Grid>
          </Grid>
        ) : valueType === 'list' ? (
          <EditBoxList
            label={label}
            keyitem={key}
            keylist={keylist}
            json={json}
            onSave={setValue}
            nodecount={(nodecount++).toString()}
          />
        ) : (
          <TreeItem
            sx={{ width: '100%' }}
            itemId={(nodecount++).toString()}
            key={key}
            label={label}
          >
            <HighlightJSON
              keylist={[...keylist, key]}
              json={json}
              setMenu={setMenu}
              nodeid={nodeid}
            />
          </TreeItem>
        )}
      </Box>
    );
  });

  return <>{fieldlist}</>;
};

export default HighlightJSON;
