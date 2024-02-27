import { TreeItem } from '@mui/x-tree-view/TreeItem';
import React, { useEffect } from 'react';
import { HighlightJSON } from './HighlightJSON';

import { makeStyles } from '@material-ui/core/styles';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';

import { faLink } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const useStyles = makeStyles(() => ({
  text: {
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
  switch (valueType) {
    case 'string':
      return classes.text;
    case 'number':
      return classes.number;
    case 'boolean':
      return classes.boolean;
    default:
      return classes.text;
  }
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

interface IEditBoxArray {
  label: string;
  key: string;
  keylist: string[];
  json;
  setMenu: (value) => void;
  nodeid: string;
  nodecount: string;
}

export const EditBoxList = ({
  label,
  key,
  keylist,
  json,
  setMenu,
  nodeid,
  nodecount,
}: IEditBoxArray) => {
  return (
    <TreeItem nodeId={nodecount} key={key} label={label}>
      <HighlightJSON keylist={[...keylist, key]} json={json} setMenu={setMenu} nodeid={nodeid} />
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
