import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';

import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { builderLogEvent, settingsSetRepositoryTarget } from 'redux/actions';
import { getMasterRepoListURL } from 'redux/globals';
import { IRepo } from 'redux/reducers/settings';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { NestedMenuItem } from 'components/DropdownMenu';

const displayAPI = window.displayAPI;
const settingsAPI = window.settingsAPI;

interface GithubMenuProps {
  repo: string;
  branch: string;
}

const GithubMenu = ({ repo, branch }: GithubMenuProps) => {
  const dispatch = useAppDispatch();
  const [anchorMenu, setAnchorMenu] = React.useState<null | HTMLElement>(null);

  // Github repo status
  type ghStatusOpts =
    | 'unknown'
    | 'checking'
    | 'not-a-repo'
    | 'up-to-date'
    | 'behind'
    | 'ahead'
    | 'diverged'
    | 'error';
  interface ghStatusProps {
    status: ghStatusOpts;
    message?: string;
  }
  const [ghStatus, setGhStatus] = React.useState({ status: 'unknown' } as ghStatusProps);

  // Tracked files
  type ghTrackedOpts = 'unknown' | 'checking' | 'some' | 'none' | 'error';
  interface ghTrackedProps {
    status: ghTrackedOpts;
    message?: string;
    modified_files?: string[];
    added_files?: string[];
    deleted_files?: string[];
  }
  const [ghTracked, setGhTracked] = React.useState({ status: 'unknown' } as ghTrackedProps);

  // Untracked files
  type ghUntrackedOpts = 'unknown' | 'checking' | 'some' | 'none' | 'error';
  interface ghUntrackedProps {
    status: ghUntrackedOpts;
    untracked_files?: string[];
  }
  const [ghUntracked, setGhUntracked] = React.useState({ status: 'unknown' } as ghUntrackedProps);

  type ghIndicatorOpts =
    | 'unknown'
    | 'checking'
    | 'not-a-repo'
    | 'up-to-date'
    | 'modified'
    | 'error';
  const [ghIndicator, setGhIndicator] = React.useState('unknown' as ghIndicatorOpts);

  // Get repo status
  useEffect(() => {
    if (ghStatus.status === 'unknown') {
      GithubGetRepoStatus(repo, branch);
      setGhIndicator('checking');
    }
  }, []);

  const GithubGetRepoStatus = async (repo: string, branch: string) => {
    // Check if the repo is in sync with the remote
    const query = {
      query: 'settings/github-get-repo-status',
      data: {
        repo: repo,
        branch: branch,
      },
    };
    const response_status = await settingsAPI.GithubGetRepoStatus(query);
    const result_status = response_status['body'] as ghStatusProps;
    setGhStatus(result_status);
    if (result_status.status == 'error') {
      dispatch(
        builderLogEvent(`Error checking Github status for ${repo}: ${result_status.message}`),
      );
      setGhIndicator('error');
      return;
    }
    if (result_status.status === 'not-a-repo') {
      setGhIndicator('not-a-repo');
      return;
    }
    // Check for tracked file changes
    const query_tracked = {
      query: 'settings/github-get-tracked-file-changes',
      data: {
        repo: repo,
      },
    };
    const response_tracked = await settingsAPI.GithubGetRepoStatus(query_tracked);
    const result_tracked = response_tracked['body'] as ghTrackedProps;
    setGhTracked(result_tracked);

    // Check for untracked files
    const query_untracked = {
      query: 'settings/github-get-untracked-files',
      data: {
        repo: repo,
      },
    };
    const response_untracked = await settingsAPI.GithubGetRepoStatus(query_untracked);
    const result_untracked = response_untracked['body'] as ghUntrackedProps;
    setGhUntracked(result_untracked);

    // Set the indicator
    if (result_status.status === 'up-to-date') {
      if (result_tracked.status === 'none' && result_untracked.status === 'none') {
        setGhIndicator('up-to-date');
      } else {
        setGhIndicator('modified');
      }
    } else {
      setGhIndicator('modified');
    }
  };

  const onGhPull = async () => {
    settingsAPI
      .GithubPull({
        query: 'settings/github-pull',
        data: {
          repo: repo,
          branch: branch,
        },
      })
      .then((response) => {
        const result = response['body'] as { status: string; message: string };
        if (result.status === 'success') {
          // Force refresh of the repo status
        } else {
          dispatch(
            builderLogEvent(`Error pulling changes from Github for ${repo}: ${result.message}`),
          );
        }
      });
  };

  const onGhPush = async () => {
    settingsAPI
      .GithubPush({
        query: 'settings/github-push',
        data: {
          repo: repo,
          branch: branch,
        },
      })
      .then((response) => {
        const result = response['body'] as { status: string; message: string };
        if (result.status === 'success') {
          // Force refresh of the repo status
        } else {
          dispatch(
            builderLogEvent(`Error pushing changes to Github for ${repo}: ${result.message}`),
          );
        }
      });
  };

  return (
    <>
      <Box>
        <IconButton
          onClick={(e) => {
            // Only permit the github menu to open if the repo has modified elements
            setAnchorMenu(ghIndicator === 'modified' ? e.currentTarget : null);
          }}
          disableRipple // prevent field edit activating button on Enter
          disableFocusRipple //
          tabIndex={-1} //
        >
          {/* For 'unknown', 'checking' and 'not-a-repo' we don't show the github indicator */}
          {ghIndicator === 'up-to-date' && (
            <Tooltip title={ghStatus.message}>
              <GitHubIcon style={{ color: '#424242' }} />
            </Tooltip>
          )}
          {ghIndicator === 'checking' && (
            <Tooltip title="Checking repository...">
              <CircularProgress
                size={20}
                sx={{ color: '#424242' }} // dark grey
              />
            </Tooltip>
          )}
          {ghIndicator === 'modified' && (
            <Tooltip title={ghStatus.message}>
              <GitHubIcon style={{ color: 'orange' }} />
            </Tooltip>
          )}
          {ghStatus.status === 'error' && (
            <Tooltip title={ghStatus.message}>
              <GitHubIcon style={{ color: 'red' }} />
            </Tooltip>
          )}
        </IconButton>
      </Box>

      {/* Drop-down menu (github) */}
      <Menu
        anchorEl={anchorMenu}
        open={Boolean(anchorMenu)}
        onClose={() => {
          setAnchorMenu(null);
        }}
      >
        <Box sx={{ minWidth: 150 }}>
          {ghStatus.status === 'diverged' && (
            <Alert severity="warning">
              Conflicts with github detected - try pulling the latest changes
            </Alert>
          )}
          {(ghStatus.status === 'behind' || ghStatus.status === 'diverged') && (
            <Button variant="contained" fullWidth onClick={onGhPull}>
              Pull latest changes from github
            </Button>
          )}
          {ghStatus.status === 'ahead' && (
            <Button variant="contained" fullWidth onClick={onGhPush}>
              Push local updates to github
            </Button>
          )}
          {(ghTracked.status === 'some' || ghUntracked.status === 'some') && <Divider />}
          {ghTracked.status === 'some' && ghTracked.added_files.length > 0 && (
            <NestedMenuItem label="Added files">
              {ghTracked.added_files.map((file) => (
                <MenuItem key={file}>{file}</MenuItem>
              ))}
            </NestedMenuItem>
          )}
          {ghTracked.status === 'some' && ghTracked.modified_files.length > 0 && (
            <NestedMenuItem label="Modified files">
              {ghTracked.modified_files.map((file) => (
                <MenuItem key={file}>{file}</MenuItem>
              ))}
            </NestedMenuItem>
          )}
          {ghTracked.status === 'some' && ghTracked.deleted_files.length > 0 && (
            <NestedMenuItem label="Deleted files">
              {ghTracked.deleted_files.map((file) => (
                <MenuItem key={file}>{file}</MenuItem>
              ))}
            </NestedMenuItem>
          )}
          {ghUntracked.status === 'some' && ghUntracked.untracked_files.length > 0 && (
            <NestedMenuItem label="Untracked files">
              {ghUntracked.untracked_files.map((file) => (
                <MenuItem key={file}>{file}</MenuItem>
              ))}
            </NestedMenuItem>
          )}
        </Box>
      </Menu>
    </>
  );
};

const RepoOptions = () => {
  const dispatch = useAppDispatch();
  const repoSettings = useAppSelector((state) => state.settings.repositories as IRepo[]);
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
          params.row.active = !params.row.active;
          setRows(rows.map((r) => (r.id === params.row.id ? params.row : r)));
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

  const UrlDisplay = (params) => {
    const local_github_repo = true;

    if (params.row.type !== 'local') {
      return params.formattedValue; // default rendering
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            textAlign: 'left',
            overflowX: 'hidden',
          }}
        >
          {params.row.url}
        </Box>
        {local_github_repo && <GithubMenu repo={params.row.url} branch="main" />}
        <IconButton
          onClick={() => {
            displayAPI.SelectFolder(params.row.url).then((folderPaths) => {
              params.row.url = folderPaths[0];
              setRows(rows.map((r) => (r.id === params.row.id ? params.row : r)));
            });
          }}
          disableRipple // prevent field edit activating button on Enter
          disableFocusRipple //
          tabIndex={-1} //
        >
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
        listing_type: 'DirectoryListing', // LocalFilesystem | DirectoryListing | BranchListing
        repo: '', // github repo or local path
      },
    ];
    dispatch(settingsSetRepositoryTarget(newRepoSettings));
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
    setRows(rows.filter((r) => !rowSelectionModel.includes(r.id)));
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

  return (
    <Box>
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
