import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import React from 'react';

const ModuleInputs = () => {
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
      valueOptions: ['in', 'out', 'db'],
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

  const [rows, setRows] = React.useState([]);

  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);

  const addRow = (label: string, port: string, filename: string) => {
    setRows((prevRows) => [...prevRows, createRow(label, port, filename)]);
  };

  const createRow = (label: string, port: string, filename: string) => {
    const id = rows.length === 0 ? 1 : 1 + Math.max(...rows.map((r) => r.id));
    return {
      id: id,
      port: port,
      label: label,
      filename: filename,
    };
  };

  const handleAdd = () => {
    addRow('<Label>', '', '<Filename>');
  };

  const handleRemove = () => {
    if (rows.length === 0) {
      return;
    }
    setRows(rows.filter((r) => !rowSelectionModel.includes(r.id)));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Input files
      </Typography>
      <Typography variant="body2" gutterBottom>
        Provide a list of the required input files for the module. Double-click to edit elements.
        You may use &#123;&#123;wildcards&#125;&#125; to match multiple files. The Label can be left
        blank if you do not need to reference that file in the command.
      </Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        hideFooter={true}
        onRowSelectionModelChange={(newRowSelectionModel) => {
          setRowSelectionModel(newRowSelectionModel);
        }}
        rowSelectionModel={rowSelectionModel}
      ></DataGrid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', rowGap: 1 }}>
        <Button onClick={handleAdd}>Add</Button>
        <Button onClick={handleRemove}>Remove</Button>
      </Box>
    </Box>
  );
};

export default ModuleInputs;
