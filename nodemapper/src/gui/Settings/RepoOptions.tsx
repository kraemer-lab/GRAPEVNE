import axios from 'axios';
import React from 'react';

import { useState } from 'react';
import { builderLogEvent, builderSetRepositoryTarget } from 'redux/actions';
import { getMasterRepoListURL } from 'redux/globals';
import { IRepo } from 'redux/reducers/builder';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const default_input_size = 35;

const RepoOptions: React.FC = () => {
  const dispatch = useAppDispatch();
  const repoSettings = useAppSelector((state) => state.builder.repositories as IRepo[]);

  const [repoLabel, setRepoLabel] = useState('');
  const [repoURL, setRepoURL] = useState('');
  const [repoFormType, setRepoFormType] = useState('GithubDirectory');
  const [repoLocale, setRepoLocale] = useState('github');
  const [repoListingType, setRepoListingType] = useState('DirectoryListing');

  const [repoListSelectedItems, setRepoListSelectedItems] = useState('');

  const selectRepositoryTarget = (target) => {
    console.log(target);
    let repo = {};
    switch (target) {
      case 'LocalFilesystem':
        repo = {
          type: 'local',
          listing_type: 'DirectoryListing',
        };
        break;
      case 'GithubDirectory':
        repo = {
          type: 'github',
          listing_type: 'DirectoryListing',
        };
        break;
      case 'GithubBranch':
        repo = {
          type: 'github',
          listing_type: 'BranchListing',
        };
        break;
      default:
        console.error('Unknown repository type selected: ', target);
    }
    setRepoListingType(repo['listing_type']);
    setRepoLocale(repo['type']);
    setRepoFormType(target);
  };

  const OnClickReloadMasterList = () => {
    console.log('Reload master list');
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
    console.log('Remove item:', repoListSelectedItems);
    const newRepoSettings = repoSettings.filter((repo) => repo.label !== repoListSelectedItems);
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
    // Set the selected item
    setRepoListSelectedItems(value);
  };

  return (
    <div>
      <Typography variant="h6">Repository List</Typography>
      <select
        id="selectBuilderSettingsRepositoryList"
        size={8}
        multiple={false}
        style={{ width: '100%' }}
        onChange={(e) => RepoListSelectItem(e.target.value)}
      >
        {repoSettings.map((repo) => (
          <option key={repo.label}>{repo.label}</option>
        ))}
      </select>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
        }}
      >
        <Box display="flex" flexDirection="row" width="100%" justifyContent="flex-end">
          <Button
            id="buttonBuilderSettingsRepositoryLoadMasterList"
            onClick={() => OnClickReloadMasterList()}
            style={{ marginRight: '5px' }}
            size="small"
            variant="contained"
          >
            RELOAD MASTER LIST
          </Button>
          <Button
            id="buttonBuilderSettingsRepositoryListAddItem"
            onClick={() => OnClickAddItem()}
            style={{ marginRight: '5px' }}
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
      </div>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            width: '15%',
            textAlign: 'right',
          }}
        >
          <Typography variant="body1">Label:</Typography>
        </div>
        <TextField
          id="inputBuilderSettingsRepositoryLabel"
          type="text"
          value={repoLabel}
          onChange={(e) => setRepoLabel(e.target.value)}
          size="small"
          style={{ width: '100%' }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            width: '15%',
            textAlign: 'right',
          }}
        >
          <Typography variant="body1">Type:</Typography>
        </div>
        <Select
          id="selectBuilderSettingsRepositoryType"
          value={repoFormType}
          onChange={(e) => selectRepositoryTarget(e.target.value)}
          style={{ width: '100%' }}
          size="small"
        >
          <MenuItem value="GithubDirectory">Github (Directory Listing)</MenuItem>
          <MenuItem value="LocalFilesystem">Local filesystem</MenuItem>
          {/*<option value="GithubBranch">Github (Branch Listing)</option>*/}
        </Select>
      </div>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            width: '15%',
            textAlign: 'right',
          }}
        >
          <Typography variant="body1">URL:</Typography>
        </div>
        <TextField
          id="inputBuilderSettingsRepositoryURL"
          type="text"
          value={repoURL}
          onChange={(e) => setRepoURL(e.target.value)}
          style={{ width: '100%' }}
          size="small"
        />
      </div>
    </div>
  );
};

export default RepoOptions;
