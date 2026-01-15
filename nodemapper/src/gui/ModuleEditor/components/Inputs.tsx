import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef, GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
import React from 'react';
import { newmoduleUpdateConfig } from 'redux/actions';
import { INewModuleStateConfigInputFilesRow } from 'redux/reducers/newmodule';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import InputPorts from './InputPorts';

export const EMPTY_SELECTION: GridRowSelectionModel = {
  type: 'include',
  ids: new Set<GridRowId>(),
};

const ModuleInputs = () => {
  const moduleConfig = useAppSelector((state) => state.newmodule.config);
  const rows = moduleConfig.input_files;
  const dispatch = useAppDispatch();

  const columns: GridColDef[] = [
    {
      field: 'label',
      headerName: 'Label',
      type: 'string',
      editable: true,
      width: 100,
    },
    {
      field: 'port',
      headerName: 'Port',
      type: 'singleSelect',
      valueOptions: moduleConfig.ports,
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

  const [rowSelectionModel, setRowSelectionModel] =
    React.useState<GridRowSelectionModel>(EMPTY_SELECTION);

  const setRows = (newRows: INewModuleStateConfigInputFilesRow[]) => {
    const newmoduleConfig = { ...moduleConfig };
    newmoduleConfig.input_files = newRows;
    dispatch(newmoduleUpdateConfig(newmoduleConfig));
  };

  const addRow = (label: string, port: string, filename: string) => {
    setRows([...rows, createRow(label, port, filename)]);
  };

  const createRow = (label: string, port: string, filename: string) => {
    const id = rows.length === 0 ? 1 : 1 + Math.max(...rows.map((r) => r.id));
    return {
      id: id,
      port: port,
      label: label,
      filename: filename,
    } as INewModuleStateConfigInputFilesRow;
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
    addRow(`Label${id}`, '', `filename${id}.ext`);
  };

  const handleRemove = () => {
    if (rows.length === 0) {
      return;
    }
    setRows(rows.filter((r) => !rowSelectionModel.ids.has(r.id)));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', rowGap: 1, width: '100%' }}>
        <Typography variant="body2" gutterBottom>
          Enter new input port names (then RETURN or SPACE to add).
        </Typography>
        <InputPorts />
        <Typography variant="body2" gutterBottom>
          Provide a list of the required input files for the module. Double-click to edit elements.
          You may use &#123;&#123;wildcards&#125;&#125; to match multiple files. The Label can be
          left blank if you do not need to reference that file in the command.
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
          <Button id="btnInputFilesAdd" onClick={handleAdd}>
            Add
          </Button>
          <Button
            id="btnInputFilesRemove"
            onClick={handleRemove}
            disabled={rowSelectionModel.ids.size === 0}
          >
            Remove
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ModuleInputs;
