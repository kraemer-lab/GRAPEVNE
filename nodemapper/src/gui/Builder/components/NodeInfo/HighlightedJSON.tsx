import React from 'react';
import ParameterList from './ParameterList';

import { useState } from 'react';
import { useAppSelector } from 'redux/store/hooks';
import HighlightJSON from './HighlightJSON';

import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
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

interface HighlightedJSONProps {
  nodeid: string;
  json: string;
}

const HighlightedJSON = (props: HighlightedJSONProps) => {
  const display_module_settings = useAppSelector((state) => state.builder.display_module_settings);
  const [menu, setMenu] = useState(null);

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
        return [];
      }
    }
    // Non-hierarchical module, expand all
    return Array.from({ length: 999 }, (_, i) => i.toString());
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
          <HighlightJSON
            keylist={[]}
            json={json}
            setMenu={setMenu}
            nodeid={props.nodeid}
          />
        </TreeView>
      </ThemeProvider>

      {menu && <ParameterList {...menu} />}
    </Box>
  );
};

export default HighlightedJSON;
