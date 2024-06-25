import { TreeItem } from '@mui/x-tree-view/TreeItem';
import React, { useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';

import AddIcon from '@mui/icons-material/AddBox';
import RemoveIcon from '@mui/icons-material/IndeterminateCheckBox';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';

import { faLink } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const useStyles = makeStyles(() => ({
  string: {
    color: '#0E7569',
  },
  number: {
    color: '#8800cc',
  },
  boolean: {
    color: '#d3869b',
  },
}));

const useStyle = (valueType: string) => {
  const classes = useStyles();
  return classes[valueType];
};

interface IEditBoxText {
  id?: string;
  value: string;
  valueType?: string;
  onSave?: (v: string) => void;
  allowEdit?: boolean;
  canConnectParameter?: boolean;
  connectParameter?: () => void;
}

const EditBoxTextDefaults: IEditBoxText = {
  id: '',
  value: '',
  valueType: 'string',
  allowEdit: true,
  onSave: () => {},
  canConnectParameter: false,
};

export const EditBoxText = (userprops: IEditBoxText) => {
  const {
    id,
    value,
    valueType,
    allowEdit,
    onSave,
    canConnectParameter,
    connectParameter,
  }: IEditBoxText = { ...EditBoxTextDefaults, ...userprops };
  const [name, setName] = React.useState(value);
  const [hasChanged, setHasChanged] = React.useState(false);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setHasChanged(true);
  };

  const onBlur = () => {
    if (hasChanged) {
      setHasChanged(false);
      onSave(name);
    }
  };

  useEffect(() => {
    return () => {
      onBlur(); // on unmount
    };
  }, []);

  return (
    <Input
      id={id}
      value={name}
      onChange={onChange}
      onKeyPress={(event) => {
        if (event.key === 'Enter') {
          onBlur();
        }
      }}
      onKeyDown={e => e.stopPropagation()}  // prevent letter search-select in TreeView
      onBlur={onBlur}
      inputProps={{
        className: useStyle(valueType),
      }}
      endAdornment={
        <InputAdornment position="end">
          {canConnectParameter && (
            <ConnectParameter id={id + '_link'} connectParameter={connectParameter} />
          )}
        </InputAdornment>
      }
      disabled={!allowEdit}
      size="small"
      margin="none"
      fullWidth
    />
  );
};

interface IEditBoxSelect {
  value: string;
  options: { label: string; value: string }[];
  onSave;
}

export const EditBoxSelect = ({ value, options, onSave }: IEditBoxSelect) => {
  const [name, setName] = React.useState(value);

  return (
    <Select
      value={name}
      size="small"
      variant="standard"
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      }}
      inputProps={{
        className: useStyle('string'),
        onBlur: () => {
          onSave(name);
        },
      }}
      fullWidth
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
};

interface IEditBoxBoolean {
  value: string;
  onSave;
}

export const EditBoxBoolean = ({ value, onSave }: IEditBoxBoolean) => {
  const [name, setName] = React.useState(value);

  return (
    <Select
      value={name}
      size="small"
      variant="standard"
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      }}
      inputProps={{
        className: useStyle('boolean'),
        onBlur: () => {
          onSave(name);
        },
      }}
      fullWidth
    >
      <MenuItem key="true" value="true">
        true
      </MenuItem>
      <MenuItem key="false" value="false">
        false
      </MenuItem>
    </Select>
  );
};

interface IEditBoxList {
  label: string;
  keyitem: string;
  keylist: string[];
  json;
  onSave: (v) => void;
  nodecount: string;
}

export const EditBoxList = ({ label, keyitem, keylist, json, onSave, nodecount }: IEditBoxList) => {
  // Isolate current branch in the json tree (indexed by keylist)
  let jsonObj = json;
  for (let i = 0; i < keylist.length; i++) {
    jsonObj = jsonObj[keylist[i]];
  }
  jsonObj = jsonObj[keyitem];

  console.log('jsonObj:', jsonObj);

  const listitems = Object.keys(jsonObj).map((key) => {
    return (
      <Box key={key} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <IconButton
          size="small"
          onClick={() => {
            jsonObj = jsonObj.filter((_, i) => i !== parseInt(key));
            onSave(jsonObj);
          }}
        >
          <RemoveIcon />
        </IconButton>
        <EditBoxText
          key={key}
          id={key}
          value={jsonObj[key]}
          onSave={(v) => {
            jsonObj[key] = v;
            onSave(jsonObj);
          }}
        />
      </Box>
    );
  });

  return (
    <TreeItem sx={{ width: '100%' }} itemId={nodecount} key={keyitem} label={label}>
      <Stack>{listitems}</Stack>

      <IconButton
        size="small"
        onClick={() => {
          jsonObj.push('');
          onSave(jsonObj);
        }}
      >
        <AddIcon />
      </IconButton>
    </TreeItem>
  );
};

const ConnectParameter = (props: { id; connectParameter }) => {
  return (
    <span
      id={props.id}
      style={{
        cursor: 'pointer',
        fontSize: '0.8em',
      }}
      onClick={() => props.connectParameter()}
    >
      <Typography variant="key" sx={{ marginLeft: '5px' }}>
        <FontAwesomeIcon icon={faLink} />
      </Typography>
    </span>
  );
};
