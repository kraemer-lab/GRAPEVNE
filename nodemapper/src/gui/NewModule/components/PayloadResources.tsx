import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import React from 'react';
import { newmoduleUpdateConfig } from 'redux/actions';
import { INewModuleStateConfigFile } from 'redux/reducers/newmodule';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const fixId = (r: INewModuleStateConfigFile) => {
  return {
    id: r.label + ':' + r.filename,
    label: r.label,
    filename: r.filename,
    isfolder: r.isfolder,
  };
};

interface ElectronFile extends File {
  path: string;
}

const PayloadDropzone = () => {
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();

  const handleClick = () => {
    // Get file names (includes path if run in electron)
    const element = document.createElement('input');
    element.setAttribute('type', 'file');
    element.setAttribute('multiple', 'multiple');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    element.onchange = (e) => {
      const fileInput = (e.target as HTMLInputElement).files;
      const files: ElectronFile[] = [];
      for(let i = 0; i < fileInput.length; i++) {
        files.push(fileInput[i] as ElectronFile);
      }
      // Add file to config state
      const newmoduleConfig = { ...moduleConfig };
      const newfiles = files
        .map(
          (file) =>
            ({
              id: '', // populated by fixId
              label: '',
              filename: file.path,
              isfolder: false,
            }) as INewModuleStateConfigFile,
        )
        .map(fixId);
      const newfiles_ids = newfiles.map((f) => f.id);
      newmoduleConfig.resources = newmoduleConfig.resources.filter((f) => !newfiles_ids.includes(f.id));
      newmoduleConfig.resources = newmoduleConfig.resources.concat(newfiles);
      dispatch(newmoduleUpdateConfig(newmoduleConfig));
    };
    document.body.removeChild(element);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed',
        borderColor: 'primary.main',
        borderRadius: 1,
        height: '100%',
        minHeight: 200,
        width: '100%',
        curosor: 'pointer',
      }}
      onClick={handleClick}
    >
      <Typography>Click to select files</Typography>
    </Box>
  );
};

const PayloadFilelist = () => {
  const columns: GridColDef[] = [
    { field: 'label', headerName: 'Label', editable: true, width: 100 },
    { field: 'filename', headerName: 'Filename', editable: false, width: 400 },
    {
      field: 'isfolder',
      headerName: 'Folder',
      editable: false,
      renderCell: (params) => {
        return <Checkbox checked={params.value} disabled />;
      },
    },
  ];
  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const dispatch = useAppDispatch();
  const rows = moduleConfig.resources;

  const setRows = (newRows: INewModuleStateConfigFile[]) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.resources = newRows.map(fixId);
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  const handleRemove = () => {
    if (rows.length === 0) {
      return;
    }
    setRows(rows.filter((r) => !rowSelectionModel.includes(r.id)));
  };

  return (
    <Box>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: { paginationModel: { pageSize: 5 } },
        }}
        processRowUpdate={(newRow, oldRow) => {
          // Update the row in the state
          setRows(rows.map((r) => (r.id === oldRow.id ? newRow : r)));
          return fixId(newRow);
        }}
        onRowSelectionModelChange={(newRowSelectionModel) => {
          setRowSelectionModel(newRowSelectionModel);
        }}
        rowSelectionModel={rowSelectionModel}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', rowGap: 1 }}>
        <Button onClick={handleRemove}>Remove</Button>
      </Box>
    </Box>
  );
};

const PayloadInterface = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={8}>
        <PayloadFilelist />
      </Grid>
      <Grid item xs={4}>
        <PayloadDropzone />
      </Grid>
    </Grid>
  );
};

const ModulePayloadResources = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Resources
      </Typography>
      <Typography variant="body2" gutterBottom>
        Provide the files to be included in the module.
      </Typography>
      <PayloadInterface />
    </Box>
  );
};

export default ModulePayloadResources;
