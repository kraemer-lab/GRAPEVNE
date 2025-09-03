import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';

import {
  DataGrid,
  GridCellEditStopReasons,
  GridColDef,
  GridRowId,
  GridRowSelectionModel,
  useGridApiRef,
} from '@mui/x-data-grid';
import { GithubMenu } from 'gui/Settings/RepoGhIndicator';
import { builderLogEvent, settingsSetRepositoryTarget } from 'redux/actions';
import { getMasterRepoListURL } from 'redux/globals';
import { IRepo } from 'redux/reducers/settings';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { DialogPrompt } from 'components/DialogPrompt';
import { DialogWait } from 'components/DialogWait';

const displayAPI = window.displayAPI;
const settingsAPI = window.settingsAPI;

export const EMPTY_SELECTION: GridRowSelectionModel = {
  type: 'include',
  ids: new Set<GridRowId>(),
};

const RepoOptions = () => {
  const dispatch = useAppDispatch();
  const repoSettings = useAppSelector((state) => state.settings.repositories as IRepo[]);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>(EMPTY_SELECTION);
  const repoSettingsRef = useRef(repoSettings);
  const [openWait, setOpenWait] = useState<boolean>(false);
  const [openPromptURL, setOpenPromptURL] = useState<boolean>(false);
  const [valuePromptURL, setValuePromptURL] = useState<string>('');
  const [clonePath, setClonePath] = useState<string>('');
  const containerRef = useRef(null);

  const apiRef = useGridApiRef();
  const pendingLabelChangeRef = useRef<{ oldId: string; newId: string } | null>(null);

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
      renderCell: (params) => ActiveDisplay(params), // custom display
    },
    {
      field: 'label',
      headerName: 'Label',
      maxWidth: 150, // px
      width: 37, // percentage (will be rescaled below)
      editable: true,
    },
    {
      field: 'type',
      headerName: 'Type',
      maxWidth: 100, // px
      width: 27, // %
      editable: true,
      type: 'singleSelect',
      valueOptions: ['github', 'local'],
    },
    {
      field: 'url',
      headerName: 'URL',
      maxWidth: 10000,
      width: 40, // %
      editable: true,
      renderCell: (params) => UrlDisplay(params), // custom display
    },
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
        onClick={() => {
          const updated = { ...params.row, active: !params.row.active };
          setRows(rows.map((r) => (r.id === updated.id ? updated : r)));
        }}
      >
        {params.value ? (
          <CheckCircleIcon style={{ color: 'green' }} />
        ) : (
          <HighlightOffIcon style={{ color: 'grey' }} />
        )}
      </Box>
    );
  };

  const UrlDisplay = (params: any) => {
    if (params.row.type !== 'local') return params.formattedValue;

    const handlePickFolder = async () => {
      const folderPaths = await displayAPI.SelectFolder(params.row.url ?? '');
      if (!folderPaths || folderPaths.length === 0) return;
      const chosen = folderPaths[0];

      // Build next Redux state from the *latest* repositories
      const current = repoSettingsRef.current;
      const updated = current.map((r) =>
        r.label === (params.row.id ?? params.row.label) ? { ...r, repo: chosen } : r,
      );

      dispatch(settingsSetRepositoryTarget(updated));
    };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', alignItems: 'center' }}>
        <Box sx={{ width: '100%', height: '100%', textAlign: 'left', overflowX: 'hidden' }}>
          {params.row.url}
        </Box>
        {params.row.url.length > 0 && <GithubMenu repo={params.row.url} branch="main" />}
        <IconButton onClick={handlePickFolder} disableRipple disableFocusRipple tabIndex={-1}>
          <FolderOutlinedIcon />
        </IconButton>
      </Box>
    );
  };

  let rows = repoSettings.map((repo) => {
    return {
      id: repo.label,
      active: repo.active,
      label: repo.label,
      type: repo.type,
      url: repo.repo,
    };
  });

  const AddItem = () => {
    const newRepoSettings = [
      ...repoSettings,
      {
        active: true,
        type: '', // github | local
        label: NextLabel(), // user label for the repo
        listing_type: 'DirectoryListing',
        repo: '', // github repo or local path
      },
    ];
    dispatch(settingsSetRepositoryTarget(newRepoSettings));
  };

  const CloneRepo = () => {
    displayAPI.SelectFolder('').then((folderPaths) => {
      setClonePath(folderPaths[0]);
      if (folderPaths.length === 0) {
        return;
      }
      setOpenPromptURL(true);
    });
  };

  const confirmOpenPromptURL = () => {
    setOpenWait(true);
    settingsAPI
      .GithubClone({
        query: 'settings/github-clone',
        data: {
          url: valuePromptURL,
          path: clonePath,
          createfolder: true,
        },
      })
      .then((response) => {
        if (response['returncode'] === 0) {
          const repo_name = valuePromptURL.split('/').pop().replace('.git', '');
          const newRepoSettings = [
            ...repoSettings,
            {
              active: true,
              type: 'local',
              label: repo_name,
              listing_type: 'DirectoryListing',
              repo: [clonePath, repo_name].join('/'),
            },
          ];
          dispatch(settingsSetRepositoryTarget(newRepoSettings));
        } else {
          alert('Could not clone repository!');
        }
        setOpenWait(false);
      })
      .catch((e) => {
        setOpenWait(false);
        alert('Error cloning repository: ' + e);
      });
  };

  const NextLabel = () => {
    const labels = repoSettings.map((r) => r.label);
    let id = 1;
    while (labels.includes(`Label ${id}`)) {
      id += 1;
    }
    return `Label ${id}`;
  };

  const RemoveItem = () => {
    if (rows.length === 0) {
      return;
    }
    setRows(rows.filter((r) => !rowSelectionModel.ids.has(r.id)));
  };

  const setRows = (newrows) => {
    rows = newrows;
    const newRepoSettings = newrows.map((repo) => ({
      active: repo.active,
      type: repo.type,
      label: repo.label,
      listing_type: 'DirectoryListing',
      repo: repo.url,
    }));
    dispatch(settingsSetRepositoryTarget(newRepoSettings));
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
        dispatch(settingsSetRepositoryTarget(data));
      }
    });
  };

  const processRowUpdate = (newRow, oldRow) => {
    const oldId = String(oldRow.id);
    const newId = String(newRow.label);
    const newRepoSettings = repoSettings.map((repo) =>
      repo.label === oldRow.id
        ? {
            ...repo,
            active: newRow.active,
            type: newRow.type,
            label: newRow.label,
            repo: newRow.url,
          }
        : repo,
    );
    dispatch(settingsSetRepositoryTarget(newRepoSettings));
    pendingLabelChangeRef.current = { oldId, newId };
    return { ...newRow, id: newId };
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
        const usedWidth = newColumns
          .map((col) => col.width)
          .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        // Allocate all unused space to the 'url' column
        newColumns = newColumns.map((col) => ({
          ...col,
          width: col.field === 'url' ? containerWidth - usedWidth + col.width - 5 : col.width,
        }));
        setColumns(newColumns);
      }
    };
    handleResize(); // Set initial widths
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    repoSettingsRef.current = repoSettings;
  }, [repoSettings]);

  const handleCellEditStop = (params: any, event: any) => {
    if (params.field === 'label' && params.reason === GridCellEditStopReasons.enterKeyDown) {
      event.defaultMuiPrevented = true; // keep focus here; don't open a new editing row
    }
  };

  return (
    <Box>
      <DialogWait open={openWait} text={'Cloning repository...'} />
      <DialogPrompt
        open={openPromptURL}
        title={'Github repository'}
        content={'Enter the github URL (HTTPS/SSH):'}
        value={valuePromptURL}
        onChange={(event) => {
          setValuePromptURL(event.target.value);
        }}
        onCancel={() => {
          setOpenPromptURL(false);
        }}
        onConfirm={() => {
          confirmOpenPromptURL();
          setOpenPromptURL(false);
        }}
      />

      <Typography variant="h6">Repository List</Typography>
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
        }}
      >
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          columnVisibilityModel={{
            id: false,
          }}
          processRowUpdate={processRowUpdate}
          onCellEditStop={handleCellEditStop}
          onRowSelectionModelChange={(m) => setRowSelectionModel(m)}
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
            id="buttonBuilderSettingsRepositoryListCloneRepo"
            onClick={() => CloneRepo()}
            sx={{ marginRight: '5px' }}
            size="small"
            variant="contained"
          >
            CLONE
          </Button>
          <Button
            id="buttonBuilderSettingsRepositoryListRemoveItem"
            onClick={() => RemoveItem()}
            disabled={rowSelectionModel.ids.size === 0}
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
