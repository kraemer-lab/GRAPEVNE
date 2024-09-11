import React, { useEffect } from 'react';

import { builderLogEvent } from 'redux/actions';
import { useAppDispatch } from 'redux/store/hooks';

import GitHubIcon from '@mui/icons-material/GitHub';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

import { NestedMenuItem } from 'components/DropdownMenu';

const settingsAPI = window.settingsAPI;

interface GithubMenuProps {
  repo: string;
  branch: string;
}

export const GithubMenu = ({ repo, branch }: GithubMenuProps) => {
  const dispatch = useAppDispatch();
  const [anchorMenu, setAnchorMenu] = React.useState<null | HTMLElement>(null);

  // Github repo status
  type ghStatusOpts =
    // query states
    | 'unknown'
    | 'checking'
    // return codes
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
    // query states
    | 'unknown'
    | 'checking'
    // return codes
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

  const RefreshGhStatus = () => {
    setAnchorMenu(null);
    setGhIndicator('checking');
    GithubGetRepoStatus(repo, branch);
  }

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
    setGhIndicator('checking');
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
          RefreshGhStatus();
        } else {
          dispatch(
            builderLogEvent(`Error pulling changes from Github for ${repo}: ${result.message}`),
          );
          setGhIndicator('error');
          setGhStatus({ status: 'error', message: result.message });
        }
      });
  };

  const onGhPush = async () => {
    setGhIndicator('checking');
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
          RefreshGhStatus();
        } else {
          dispatch(
            builderLogEvent(`Error pushing changes to Github for ${repo}: ${result.message}`),
          );
          setGhIndicator('error');
          setGhStatus({ status: 'error', message: result.message });
        }
      });
  };

  const ghCommitAllChanges = async () => {
    settingsAPI
      .GithubCommitAllChanges({
        query: 'settings/github-commit-all-changes',
        data: {
          repo: repo,
          message: 'Commit from GRAPEVNE',
          author: 'GRAPEVNE',
          email: null,
        },
      })
      .then((response) => {
        const result = response['body'] as { status: string; message: string };
        if (result.status === 'success') {
          // Force refresh of the repo status
        } else {
          dispatch(
            builderLogEvent(`Error committing changes to Github for ${repo}: ${result.message}`),
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
              <GitHubIcon
                style={{ color: '#424242' }}
                onClick={() => {
                  RefreshGhStatus();
                }}
              />
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
          {(ghTracked.status === 'some' || ghUntracked.status === 'some') && (
            <Button variant="contained" fullWidth onClick={ghCommitAllChanges}>
              Commit all changes
            </Button>
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

export default GithubMenu;
