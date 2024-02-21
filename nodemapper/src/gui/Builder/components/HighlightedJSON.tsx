import React from 'react';
import EasyEdit from 'react-easy-edit';
import ParameterList from './ParameterList';

import { faCheck, faLink, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Types } from 'react-easy-edit';
import { builderUpdateNode, builderUpdateNodeInfoKey } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { getNodeById, getNodeByName } from './Flow';

import { Typography } from '@mui/material';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { TreeView } from '@mui/x-tree-view/TreeView';
import type {} from '@mui/x-tree-view/themeAugmentation';

import Box from '@mui/material/Box';

import './HighlightedJSON.css';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    key: true;
    struct: true;
  }
}

export const generateTheme = (theme) =>
  createTheme({
    palette: {
      mode: 'light',
    },
    components: {
      MuiTreeItem: {
        styleOverrides: {
          content: {
            padding: '0px',
          },
          iconContainer: {
            display: 'none',
          },
          label: {
            padding: '0px',
            color: theme.palette.text.secondary,
            fontWeight: 'bold',
          },
        },
      },
      MuiTypography: {
        variants: [
          {
            props: { variant: 'key' },
            style: {
              color: theme.palette.text.secondary,
              marginRight: '0.5rem',
              fontWeight: 'normal',
            },
          },
        ],
      },
    },
  });

const TypoKey = (props) => <Typography variant="key" {...props} />;
const TypoStruct = (props) => <Typography variant="struct" {...props} />;

/*
 * HighlightedJSON code modified from:
 * https://codepen.io/benshope/pen/BxVpjo
 */

const protectedNames = ['input_namespace', 'output_namespace', 'snakefile', 'docstring'];

interface IHighlightJSONProps {
  keylist: string[];
}

const addQuotesIfString = (value: string, isString: boolean) => {
  if (isString) return `"${value}"`;
  return value;
};

interface HighlightedJSONProps {
  nodeid: string;
  json: string;
}

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

const ConnectParameter = (props: { connectParameter }) => {
  return (
    <span
      style={{
        cursor: 'pointer',
        fontSize: '0.8em',
      }}
      onClick={() => props.connectParameter()}
    >
      <TypoKey sx={{ marginLeft: '5px' }}>
        <FontAwesomeIcon icon={faLink} />
      </TypoKey>
    </span>
  );
};

const DisconnectParameter = (props: { disconnectParameter }) => {
  return (
    <span
      style={{
        cursor: 'pointer',
        color: '#8B0000',
      }}
      onClick={() => props.disconnectParameter()}
    >
      <TypoKey sx={{ marginLeft: '5px' }}>
        <FontAwesomeIcon icon={faTimes} />
      </TypoKey>
    </span>
  );
};

export const checkParameter_IsModuleRoot = (value) => {
  if (value === undefined) return false;
  // Parameter is a module root if it contains a 'snakefile' field
  if (Object.keys(value).includes('snakefile')) return true;
  return false;
};

export const checkParameter_IsInModuleConfigLayer = (node, keylist, key) => {
  if (node === undefined || node === null) return false;
  // Is the parameters parent a module root?
  let jsonObj = JSON.parse(JSON.stringify(node))['data']['config']['config'];
  for (let i = 0; i < keylist.length; i++) {
    jsonObj = jsonObj[keylist[i]];
    if (jsonObj === undefined) return false;
  }
  if (checkParameter_IsModuleRoot(jsonObj)) return true;
  return false;
};

const HighlightedJSON = (props: HighlightedJSONProps) => {
  const nodes = useAppSelector((state) => state.builder.nodes);
  const dispatch = useAppDispatch();
  const display_module_settings = useAppSelector((state) => state.builder.display_module_settings);
  const [menu, setMenu] = useState(null);
  let nodeId = 0;

  // Parse JSON string
  const json_str: string = props.json;
  if (json_str === '' || json_str === undefined || json_str === JSON.stringify({}))
    return <Box className="json"></Box>;
  const json = JSON.parse(json_str);

  const concertinaIfHierarchicalModule = (json) => {
    if (display_module_settings) return Array.from({ length: 999 }, (_, i) => i.toString());
    if (json === undefined) return [];
    const jsonConfig = json['config'];
    if (jsonConfig === undefined) return [];
    // Check for hierarchical module
    for (const key in jsonConfig) {
      if (jsonConfig[key] != undefined && jsonConfig[key]['snakefile'] !== undefined) {
        console.log('Hierarchical module');
        return [];
      }
    }
    // Non-hierarchical module, expand all
    console.log('Non-hierarchical module');
    return Array.from({ length: 999 }, (_, i) => i.toString());
  };

  // Recursive function to render the JSON tree
  const HighlightJSON = ({ keylist }: IHighlightJSONProps) => {
    // Isolate current branch in the json tree (indexed by keylist)
    let jsonObj = json;
    for (let i = 0; i < keylist.length; i++) {
      jsonObj = jsonObj[keylist[i]];
    }
    // Map the JSON sub-fields to a list of rendered elements
    const fieldlist = Object.keys(jsonObj).map((key) => {
      let value = jsonObj[key];
      let valueType: string = typeof value;
      const isSimpleValue = ['string', 'number', 'boolean'].includes(valueType) || !value;
      if (isSimpleValue && valueType === 'object') {
        valueType = 'null' as undefined;
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
        if (metadata['type'] === 'select') {
          valueType = 'select';
          for (const option of metadata['options']) {
            valueOptions.push({
              label: option,
              value: option,
            });
          }
        }
        // Check whether the parameter is linked to another parameter
        if (metadata['link'] !== undefined) {
          let link_from = metadata['link'];
          const link_node = link_from[0];
          link_from = link_from.slice(1, link_from.length);
          parameterValue = lookupKeyGlobal(json, link_node, link_from, '');
          if (parameterValue === undefined) {
            parameterValue = '(linked value is undefined)';
          }
          if (parameterValue === '') {
            parameterValue = '(linked value is empty)';
          }
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
      const node = getNodeById(props.nodeid, nodes);
      const isInModuleConfigLayer = checkParameter_IsInModuleConfigLayer(node, keylist, key);
      if (isInModuleConfigLayer && !display_module_settings) {
        // Of the parameters in the module config layer, continue rendering only the
        // 'config' children, which contains the actual parameters
        if (key !== 'config') {
          return null;
        } else {
          return <HighlightJSON keylist={[...keylist, key]} key={(nodeId++).toString()} />;
        }
      }

      // Callback to update field in central state (triggers re-render)
      const setValue = (value) => {
        dispatch(builderUpdateNodeInfoKey({ keys: [...keylist, key], value: value }));
      };

      // Callback to connect parameters between modules
      const connectParameter = () => {
        console.log('Connect parameter: ', key);
        setMenu({
          id: props.nodeid,
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

      // Callback to disconnect parameters between modules
      const disconnectParameter = () => {
        console.log('Disconnect parameter: ', key);
        const node = getNodeById(props.nodeid, nodes);
        const newnode = JSON.parse(JSON.stringify(node));
        const module_settings = newnode.data.config.config;
        const metadata = lookupKey(module_settings, keylist, ':' + key);
        delete metadata['link'];
        if (Object.keys(metadata).length === 0) {
          const parent = lookupKey(
            module_settings,
            keylist.slice(0, keylist.length - 1),
            keylist[keylist.length - 1],
          );
          delete parent[':' + key];
        }
        dispatch(builderUpdateNode(newnode));
      };

      return (
        <Box style={{ cursor: 'default' }} key={key} className="line">
          {isProtectedValue ? (
            <span>
              <TypoKey className="key">{label}:</TypoKey>
              <span
                className="protected"
                style={{
                  display: 'inline-block',
                  height: '25px',
                }}
              >
                {value}
              </span>
            </span>
          ) : isParameterConnected ? (
            <span>
              <TypoKey className="key">{label}:</TypoKey>
              <span
                className="linked"
                style={{
                  display: 'inline-block',
                  height: '25px',
                }}
              >
                <EasyEdit
                  type={Types.TEXT}
                  style={{ cursor: 'pointer' }}
                  onHoverCssClass="string"
                  value={parameterValue}
                  onSave={(value) => {
                    return;
                  }}
                  allowEdit={false}
                />
              </span>
              <ConnectParameter connectParameter={connectParameter} />
            </span>
          ) : isSimpleValue ? (
            <span>
              <TypoKey className="key">{label}:</TypoKey>
              <span
                className={valueType}
                style={{
                  display: 'inline-block',
                  height: '25px',
                }}
              >
                {valueType === 'boolean' ? (
                  <EasyEdit
                    type={Types.SELECT}
                    style={{ cursor: 'pointer' }}
                    onHoverCssClass="boolean"
                    saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
                    cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
                    value={value ? 'true' : 'false'}
                    options={[
                      { label: 'true', value: true },
                      { label: 'false', value: false },
                    ]}
                    onSave={(value) => {
                      setValue(value === 'true');
                    }}
                    saveOnBlur={true}
                  />
                ) : valueType === 'select' ? (
                  <EasyEdit
                    type={Types.SELECT}
                    style={{ cursor: 'pointer' }}
                    onHoverCssClass="string"
                    saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
                    cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
                    value={value}
                    options={valueOptions}
                    onSave={setValue}
                    saveOnBlur={true}
                  />
                ) : (
                  <EasyEdit
                    type={Types.TEXT}
                    style={{ cursor: 'pointer' }}
                    onHoverCssClass="string"
                    saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
                    cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
                    value={value}
                    onSave={setValue}
                    saveOnBlur={true}
                  />
                )}
              </span>
              {canConnectParameter && <ConnectParameter connectParameter={connectParameter} />}
            </span>
          ) : (
            <TreeItem nodeId={(nodeId++).toString()} key={key} label={label}>
              <HighlightJSON keylist={[...keylist, key]} />
            </TreeItem>
          )}
        </Box>
      );
    });
    return <>{fieldlist}</>;
  };

  // Render the JSON tree
  return (
    <Box
      className="json"
      style={{
        padding: '2px',
      }}
    >
      <ThemeProvider theme={generateTheme(useTheme())}>
        <TreeView defaultExpanded={concertinaIfHierarchicalModule(json)}>
          <HighlightJSON keylist={[]} />
        </TreeView>
      </ThemeProvider>

      {menu && <ParameterList {...menu} />}
    </Box>
  );
};

export default HighlightedJSON;
