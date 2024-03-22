import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { Component } from 'react';

import { DropzoneArea } from 'material-ui-dropzone';

class PayloadDropzone extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
    };
  }
  handleChange(files) {
    this.setState({
      files: files,
    });
  }
  render() {
    return <DropzoneArea onChange={this.handleChange.bind(this)} />;
  }
}

const PayloadFilelist = () => {
  const columns: GridColDef[] = [
    { field: 'label', headerName: 'Label', editable: true, width: 100 },
    { field: 'filename', headerName: 'Filename', editable: false, width: 400 },
  ];
  const [rows, setRows] = React.useState([]);

  return (
    <Box>
      <DataGrid rows={rows} columns={columns} hideFooter={true} />
    </Box>
  );
};

const PayloadInterface = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', rowGap: 1, width: '100%' }}>
      <PayloadFilelist />
      <PayloadDropzone />
    </Box>
  );
};

const ModulePayloadScripts = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Scripts
      </Typography>
      <Typography variant="body2" gutterBottom>
        Provide the files to be included in the module.
      </Typography>
      <PayloadInterface />
    </Box>
  );
};

export default ModulePayloadScripts;
