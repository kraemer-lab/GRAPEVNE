import axios from 'axios';
import React, {useRef, useEffect, useState} from 'react';

import { builderLogEvent, builderSetRepositoryTarget } from 'redux/actions';
import { getMasterRepoListURL } from 'redux/globals';
import { IRepo } from 'redux/reducers/builder';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const displayAPI = window.displayAPI;

const RepoOptions = () => {
  const dispatch = useAppDispatch();
  const repoSettings = useAppSelector((state) => state.builder.repositories as IRepo[]);
  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
  const containerRef = useRef(null);
  
  const initialColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      maxWidth: 150,
      width: 0,
      editable: true,
    },
    {
      field: 'active',
      headerName: '',
      maxWidth: 50,
      width: 6,
      editable: true,
      type: 'boolean',
      renderCell: (params) => ActiveDisplay(params),  // custom display
    },
    {
      field: 'label',
      headerName: 'Label',
      maxWidth: 150,  // px
      width: 37,      // percentage (will be rescaled below)
      editable: true,
    },
    { 
      field: 'type',
      headerName: 'Type',
      maxWidth: 100,  // px
      width: 27,  // %
      editable: true,
      type: 'singleSelect',
      valueOptions: ['github', 'local'],
    },
    {
      field: 'url',
      headerName: 'URL',
      maxWidth: 10000,
      width: 40,  // %
      editable: true,
      renderCell: (params) => UrlDisplay(params),  // custom display
    }
  ];
  const [columns, setColumns] = useState<GridColDef[]>(initialColumns);

  const ActiveDisplay = (params) => {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {params.value ? (
          <CheckCircleIcon style={{ color: 'green' }} />
        ) : (
          <HighlightOffIcon style={{ color: 'grey' }} />
        )}
      </Box>
    )
  }

  const UrlDisplay = (params) => {
    if (params.row.type !== "local") {
      return params.formattedValue;  // default rendering
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            textAlign: "left",
            overflowX: "hidden",
          }}
        >
          {params.row.url}
        </Box>
        <IconButton
          onClick={() => {
            displayAPI.SelectFolder(params.row.url).then((folderPaths) => {
              params.row.url = folderPaths[0];
              setRows(rows.map((r) => (r.id === params.row.id ? params.row : r)));
            });
          }}
          disableRipple       // prevent field edit activating button on Enter
          disableFocusRipple  //
          tabIndex={-1}       //
        >
          <FolderOutlinedIcon />
        </IconButton>
      </Box>
    )
  };
  
  let rows = repoSettings.map((repo) => {
    return {
      id: repo.label,
      active: repo.active,
      label: repo.label,
      type: repo.type,
      url: repo.repo,
    }
  });
  
  const AddItem = () => {
    const newRepoSettings = [
      ...repoSettings,
      {
        active: true,
        type: "", // github | local
        label: NextLabel(), // user label for the repo
        listing_type: 'DirectoryListing', // LocalFilesystem | DirectoryListing | BranchListing
        repo: "", // github repo or local path
      },
    ];
    dispatch(builderSetRepositoryTarget(newRepoSettings));
  };
  
  const NextLabel = () => {
    const labels = repoSettings.map((r) => r.label);
    let id = 1;
    while (labels.includes(`Label ${id}`)) {
      id += 1;
    }
    return `Label ${id}`;
  }

  const RemoveItem = () => {
    if (rows.length === 0) {
      return;
    }
    setRows(rows.filter((r) => !rowSelectionModel.includes(r.id)));
  };

  const setRows = (newrows) => {
    rows = newrows;
    const newRepoSettings = newrows.map((repo) =>
      ({
        active: repo.active,
        type: repo.type,
        label: repo.label,
        listing_type: 'DirectoryListing',
        repo: repo.url,
      })
    );
    dispatch(builderSetRepositoryTarget(newRepoSettings));
  };

  const ReloadMasterList = () => {
    const getMasterRepoList = async () => {
      const url = getMasterRepoListURL();
      return await axios
        .get(url)
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          dispatch(builderLogEvent('Error loading master repository list'));
          dispatch(builderLogEvent(`  Error: ${error}`));
          dispatch(builderLogEvent(`  Loading URL: ${url}`));
        });
    };
    getMasterRepoList().then((data) => {
      if (data) {
        console.log('Master repo list: ', data);
        dispatch(builderSetRepositoryTarget(data));
      }
    });
  };

  const processRowUpdate = (newrow, oldrow) => {
    setRows(rows.map((r) => (r.id === oldrow.id ? newrow : r)));
    return newrow;
  };

  // Handle column widths upon resizing of the datagrid
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // First sweep - set columns widths proportional to their requested percentages
        // but within their maximum allowed limits
        let newColumns = initialColumns.map((col) => ({
          ...col,
          width: Math.min((containerWidth * col.width) / 100, col.maxWidth),
        }));
        // Add up the total space used
        const usedWidth = newColumns.map((col) => col.width).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        // Allocate all unused space to the 'url' column
        newColumns = newColumns.map((col) => ({
          ...col,
          width: (col.field === "url") ? (containerWidth - usedWidth + col.width - 5) : (col.width),
        }));
        setColumns(newColumns);
      }
    };
    handleResize(); // Set initial widths
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box>
      <Typography variant="h6">Repository List</Typography>
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
        }}
      >
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          columnVisibilityModel={{
            id: false
          }}
          processRowUpdate={processRowUpdate}
          onRowSelectionModelChange={(newRowSelectionModel) => {
            setRowSelectionModel(newRowSelectionModel);
          }}
          rowSelectionModel={rowSelectionModel}
          hideFooter={true}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
        }}
      >
        <Box display="flex" flexDirection="row" width="100%" justifyContent="flex-end">
          <Button
            id="buttonBuilderSettingsRepositoryLoadMasterList"
            onClick={() => ReloadMasterList()}
            sx={{ marginRight: '5px' }}
            size="small"
            variant="contained"
          >
            RELOAD MASTER LIST
          </Button>
          <Button
            id="buttonBuilderSettingsRepositoryListAddItem"
            onClick={() => AddItem()}
            sx={{ marginRight: '5px' }}
            size="small"
            variant="contained"
          >
            ADD
          </Button>
          <Button
            id="buttonBuilderSettingsRepositoryListRemoveItem"
            onClick={() => RemoveItem()}
            disabled={rowSelectionModel.length === 0}
            size="small"
            variant="contained"
          >
            REMOVE
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RepoOptions;
