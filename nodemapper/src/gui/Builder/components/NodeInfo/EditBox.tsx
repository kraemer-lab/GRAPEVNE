import { TreeItem } from '@mui/x-tree-view/TreeItem';
import React, { useEffect } from 'react';

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
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

const displayAPI = window.displayAPI;

const colorFor = (t: 'string' | 'number' | 'boolean') =>
  t === 'string' ? '#0E7569' : t === 'number' ? '#8800cc' : '#d3869b';

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
      onKeyDown={(e) => e.stopPropagation()} // prevent letter search-select in TreeView
      onBlur={onBlur}
      slotProps={{
        input: { sx: { color: colorFor(valueType as 'string' | 'number' | 'boolean') } },
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
      slotProps={{
        input: {
          sx: { color: colorFor('boolean') },
          onBlur: () => onSave(name),
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
      slotProps={{
        input: {
          sx: { color: colorFor('boolean') },
          onBlur: () => onSave(name),
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

interface IEditBoxFile {
  id?: string;
  value: string;
  valueType?: string;
  onSave?: (v) => void;
  allowEdit?: boolean;
  canConnectParameter?: boolean;
  connectParameter?: () => void;
}

const EditBoxFileDefaults: IEditBoxFile = {
  id: '',
  value: '',
  valueType: 'string',
  allowEdit: true,
  onSave: () => {},
  canConnectParameter: false,
};

const path_sep = () => {
  return navigator.platform.indexOf('Win') > -1 ? '\\' : '/';
};

export const EditBoxFile = (userprops: IEditBoxFile) => {
  const {
    id,
    value,
    valueType,
    allowEdit,
    onSave,
    canConnectParameter,
    connectParameter,
  }: IEditBoxFile = { ...EditBoxFileDefaults, ...userprops };
  const [name, setName] = React.useState(value);
  const [hasChanged, setHasChanged] = React.useState(false);

  const onChangeByEdit = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setHasChanged(true);
  };

  const onChangeByPicker = (v: string) => {
    setName(v);
    saveFileStruct(v);
  };

  const saveFileStruct = (v: string) => {
    let filename = '';
    let folder = '';
    if (v === undefined) return;
    if (typeof v === 'string') {
      filename = v.substring(v.lastIndexOf(path_sep()) + 1) ?? '';
      folder = v.substring(0, v.lastIndexOf(path_sep())) ?? '';
    }
    onSave({
      Filename: filename,
      Folder: folder,
    });
  };

  const onBlur = () => {
    if (hasChanged) {
      setHasChanged(false);
      saveFileStruct(name);
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
      onChange={onChangeByEdit}
      onKeyPress={(event) => {
        if (event.key === 'Enter') {
          onBlur();
        }
      }}
      onKeyDown={(e) => e.stopPropagation()} // prevent letter search-select in TreeView
      onBlur={onBlur}
      slotProps={{
        input: { sx: { color: colorFor(valueType as 'string' | 'number' | 'boolean') } },
      }}
      endAdornment={
        <InputAdornment position="end">
          <FileOpen filename={name} onChange={onChangeByPicker} />
        </InputAdornment>
      }
      disabled={!allowEdit}
      size="small"
      margin="none"
      fullWidth
    />
  );
};

interface IEditBoxFolder {
  id?: string;
  value: string;
  valueType?: string;
  onSave?: (v) => void;
  allowEdit?: boolean;
  canConnectParameter?: boolean;
  connectParameter?: () => void;
}

const EditBoxFolderDefaults: IEditBoxFolder = {
  id: '',
  value: '',
  valueType: 'string',
  allowEdit: true,
  onSave: () => {},
  canConnectParameter: false,
};

export const EditBoxFolder = (userprops: IEditBoxFolder) => {
  const {
    id,
    value,
    valueType,
    allowEdit,
    onSave,
    canConnectParameter,
    connectParameter,
  }: IEditBoxFolder = { ...EditBoxFolderDefaults, ...userprops };
  const [name, setName] = React.useState(value);
  const [hasChanged, setHasChanged] = React.useState(false);

  const onChangeByEdit = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setHasChanged(true);
  };

  const onChangeByPicker = (v: string) => {
    setName(v);
    saveFileStruct(v);
  };

  const saveFileStruct = (v: string) => {
    let folder = '';
    if (v === undefined) return;
    if (typeof v === 'string') {
      folder = v;
    }
    onSave(folder);
  };

  const onBlur = () => {
    if (hasChanged) {
      setHasChanged(false);
      saveFileStruct(name);
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
      onChange={onChangeByEdit}
      onKeyPress={(event) => {
        if (event.key === 'Enter') {
          onBlur();
        }
      }}
      onKeyDown={(e) => e.stopPropagation()} // prevent letter search-select in TreeView
      onBlur={onBlur}
      slotProps={{
        input: { sx: { color: colorFor(valueType as 'string' | 'number' | 'boolean') } },
      }}
      endAdornment={
        <InputAdornment position="end">
          <FolderOpen foldername={name} onChange={onChangeByPicker} />
        </InputAdornment>
      }
      disabled={!allowEdit}
      size="small"
      margin="none"
      fullWidth
    />
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

const FileOpen = (props: { filename; onChange }) => {
  return (
    <span
      style={{
        cursor: 'pointer',
        fontSize: '0.8em',
      }}
      onClick={() => {
        displayAPI.SelectFile(props.filename).then((file) => {
          props.onChange(file[0]);
        });
      }}
    >
      <Typography variant="key" sx={{ marginLeft: '5px' }}>
        <FolderOpenIcon />
      </Typography>
    </span>
  );
};

const FolderOpen = (props: { foldername; onChange }) => {
  return (
    <span
      style={{
        cursor: 'pointer',
        fontSize: '0.8em',
      }}
      onClick={() => {
        displayAPI.SelectFolder(props.foldername).then((file) => {
          props.onChange(file[0]);
        });
      }}
    >
      <Typography variant="key" sx={{ marginLeft: '5px' }}>
        <FolderOpenIcon />
      </Typography>
    </span>
  );
};
