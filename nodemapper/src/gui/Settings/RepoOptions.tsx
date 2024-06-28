import axios from 'axios';
import React from 'react';

import { useState } from 'react';
import { builderLogEvent, builderSetRepositoryTarget } from 'redux/actions';
import { getMasterRepoListURL } from 'redux/globals';
import { IRepo } from 'redux/reducers/builder';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const displayAPI = window.displayAPI;

const RepoOptions: React.FC<{ labelWidth: string }> = ({ labelWidth }) => {
  const dispatch = useAppDispatch();
  const repoSettings = useAppSelector((state) => state.builder.repositories as IRepo[]);

  const [repoLabel, setRepoLabel] = useState('');
  const [repoURL, setRepoURL] = useState('');
  const [repoFormType, setRepoFormType] = useState('GithubDirectory');
  const [repoLocale, setRepoLocale] = useState('github');
  const [repoListingType, setRepoListingType] = useState('DirectoryListing');
  const [displayFolderSelect, setDisplayFolderSelect] = useState(false);

  const [repoListSelectedItems, setRepoListSelectedItems] = useState([]);

  const selectRepositoryTarget = (target) => {
    let repo = {};
    switch (target) {
      case 'LocalFilesystem':
        repo = {
          type: 'local',
          listing_type: 'DirectoryListing',
        };
        setDisplayFolderSelect(true);
        break;
      case 'GithubDirectory':
        repo = {
          type: 'github',
          listing_type: 'DirectoryListing',
        };
        setDisplayFolderSelect(false);
        break;
      default:
        console.error('Unknown repository type selected: ', target);
    }
    setRepoListingType(repo['listing_type']);
    setRepoLocale(repo['type']);
    setRepoFormType(target);
  };

  const OnClickReloadMasterList = () => {
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

  const OnClickAddItem = () => {
    const newRepoSettings = [
      ...repoSettings,
      {
        type: repoLocale, // github | local
        label: repoLabel, // user label for the repo
        listing_type: 'DirectoryListing', // LocalFilesystem | DirectoryListing | BranchListing
        repo: repoURL, // github repo or local path
      },
    ];
    dispatch(builderSetRepositoryTarget(newRepoSettings));
  };

  const OnClickRemoveItem = () => {
    const newRepoSettings = repoSettings.filter(
      (repo) => !repoListSelectedItems.includes(repo.label),
    );
    dispatch(builderSetRepositoryTarget(newRepoSettings));
  };

  const RepoListSelectItem = (value) => {
    console.log('Select item:', value);
    const selected_repo = repoSettings.filter((repo) => repo.label === value)[0];
    // Display repo settings on form
    setRepoLocale(selected_repo.type);
    setRepoLabel(selected_repo.label);
    setRepoListingType(selected_repo.listing_type);
    if (selected_repo.type === 'local') setRepoFormType('LocalFilesystem');
    else setRepoFormType('GithubDirectory');
    setRepoURL(selected_repo.repo);
    setDisplayFolderSelect(selected_repo.type === 'local');
    // Set the selected item
    setRepoListSelectedItems([value]);
  };

  return (
    <Box>
      <Typography variant="h6">Repository List</Typography>
      <Select
        multiple
        native
        id="selectBuilderSettingsRepositoryList"
        sx={{
          width: '100%',
        }}
        value={repoListSelectedItems}
        onChange={(e) => RepoListSelectItem(e.target.value)}
      >
        {repoSettings.map((repo) => (
          <option key={repo.label}>{repo.label}</option>
        ))}
      </Select>
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
            onClick={() => OnClickReloadMasterList()}
            sx={{ marginRight: '5px' }}
            size="small"
            variant="contained"
          >
            RELOAD MASTER LIST
          </Button>
          <Button
            id="buttonBuilderSettingsRepositoryListAddItem"
            onClick={() => OnClickAddItem()}
            sx={{ marginRight: '5px' }}
            size="small"
            variant="contained"
          >
            ADD
          </Button>
          <Button
            id="buttonBuilderSettingsRepositoryListRemoveItem"
            onClick={() => OnClickRemoveItem()}
            size="small"
            variant="contained"
          >
            REMOVE
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'row',
        }}
      >
        <Box
          sx={{
            width: labelWidth,
            textAlign: 'right',
            alignSelf: 'center',
          }}
        >
          <Typography variant="body1">Label:</Typography>
        </Box>
        <TextField
          id="inputBuilderSettingsRepositoryLabel"
          type="text"
          value={repoLabel}
          onChange={(e) => setRepoLabel(e.target.value)}
          size="small"
          sx={{ width: '100%' }}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'row',
        }}
      >
        <Box
          sx={{
            width: labelWidth,
            textAlign: 'right',
            alignSelf: 'center',
          }}
        >
          <Typography variant="body1">Type:</Typography>
        </Box>
        <Select
          id="selectBuilderSettingsRepositoryType"
          value={repoFormType}
          onChange={(e) => selectRepositoryTarget(e.target.value)}
          sx={{ width: '100%' }}
          size="small"
        >
          <MenuItem value="GithubDirectory">Github (Directory Listing)</MenuItem>
          <MenuItem value="LocalFilesystem">Local filesystem</MenuItem>
        </Select>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'row',
        }}
      >
        <Box
          sx={{
            width: labelWidth,
            textAlign: 'right',
            alignSelf: 'center',
          }}
        >
          <Typography variant="body1">URL:</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
          }}
        >
          <TextField
            id="inputBuilderSettingsRepositoryURL"
            type="text"
            value={repoURL}
            onChange={(e) => setRepoURL(e.target.value)}
            sx={{ width: '100%' }}
            size="small"
          />
          {displayFolderSelect && (
            <IconButton
              onClick={() => {
                displayAPI.SelectFolder(repoURL).then((folderPaths) => {
                  setRepoURL(folderPaths[0]);
                });
              }}
            >
              <FolderOutlinedIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default RepoOptions;
