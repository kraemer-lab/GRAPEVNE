import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef, GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
import React from 'react';
import { newmoduleUpdateConfig } from 'redux/actions';
import { INewModuleStateConfigOutputFilesRow } from 'redux/reducers/newmodule';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

export const EMPTY_SELECTION: GridRowSelectionModel = {
  type: 'include',
  ids: new Set<GridRowId>(),
};

const ModuleOutputs = () => {
  const columns: GridColDef[] = [
    {
      field: 'label',
      headerName: 'Label',
      type: 'string',
      editable: true,
      width: 100,
    },
    {
      field: 'filename',
      headerName: 'Filename',
      type: 'string',
      editable: true,
      width: 500,
    },
  ];

  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const rows = moduleConfig.output_files;
  const dispatch = useAppDispatch();

  const [rowSelectionModel, setRowSelectionModel] =
    React.useState<GridRowSelectionModel>(EMPTY_SELECTION);

  const setRows = (newRows: INewModuleStateConfigOutputFilesRow[]) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.output_files = newRows;
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  const addRow = (label: string, filename: string) => {
    setRows([...rows, createRow(label, filename)]);
  };

  const createRow = (label: string, filename: string) => {
    const id = rows.length === 0 ? 1 : 1 + Math.max(...rows.map((r) => r.id));
    return {
      id: id,
      label: label,
      filename: filename,
    };
  };

  const getUniqueLabelID = () => {
    const labels = rows.map((r) => r.label);
    let id = 1;
    while (labels.includes(`Label${id}`)) {
      id += 1;
    }
    return id;
  };

  const handleAdd = () => {
    const id = getUniqueLabelID();
    addRow(`Label${id}`, `filename${id}.ext`);
  };

  const handleRemove = () => {
    if (rows.length === 0) {
      return;
    }
    setRows(rows.filter((r) => !rowSelectionModel.ids.has(r.id)));
  };

  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        Provide a list of the required output files for the module. You should use the same set of
        &#123;&#123;wildcards&#125;&#125; as used for the inputs.
      </Typography>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        hideFooter={true}
        processRowUpdate={(newRow, oldRow) => {
          // Update the row in the state
          setRows(rows.map((r) => (r.id === oldRow.id ? newRow : r)));
          return newRow;
        }}
        onRowSelectionModelChange={(newRowSelectionModel) => {
          setRowSelectionModel(newRowSelectionModel);
        }}
        rowSelectionModel={rowSelectionModel}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', rowGap: 1 }}>
        <Button id="btnOutputFilesAdd" onClick={handleAdd}>
          Add
        </Button>
        <Button
          id="btnOutputFilesRemove"
          onClick={handleRemove}
          disabled={rowSelectionModel.ids.size === 0}
        >
          Remove
        </Button>
      </Box>
    </Box>
  );
};

export default ModuleOutputs;
