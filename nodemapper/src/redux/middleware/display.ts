import * as globals from 'redux/globals';

import { displayStoreFolderInfo, runnerSelectNone, runnerUpdateStatusText } from 'redux/actions';

const API_ENDPOINT = globals.getApiEndpoint();

const displayAPI = window.displayAPI;
const runnerAPI = window.runnerAPI;
const backend = globals.getBackend();

export const displayMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      console.debug(action);
      switch (action.type) {
        case 'display/close-settings':
          CloseSettings(dispatch);
          break;
        case 'display/get-folder-info':
          GetFolderInfo(dispatch, getState);
          break;
        case 'display/delete-results':
          DeleteResults(dispatch, getState);
          break;
        default:
          break;
      }
      return next(action);
    };
  };
};

///////////////////////////////////////////////////////////////////////////////
// Middleware
///////////////////////////////////////////////////////////////////////////////

const CloseSettings = (dispatch) => {
  dispatch(runnerSelectNone());
};

const GetFolderInfo = async (dispatch, getState) => {
  const query: Record<string, unknown> = {
    query: 'display/folderinfo',
    data: {
      content: JSON.parse(getState().display.folderinfo).foldername,
    },
  };
  const callback = (content) => {
    // Read folder contents into state
    dispatch(displayStoreFolderInfo(content['body']));
  };
  switch (backend) {
    case 'rest':
      SubmitQuery(query, dispatch, callback);
      break;
    case 'electron':
      callback((await displayAPI.FolderInfo(query)) as Record<string, unknown>);
      break;
    default:
      console.error('Unknown backend: ', backend);
  }
};

const DeleteResults = async (dispatch, getState) => {
  const query: Record<string, unknown> = {
    query: 'runner/deleteresults',
    data: {
      format: 'Snakefile',
      content: JSON.parse(getState().display.folderinfo).foldername,
    },
  };
  const callback = (content) => {
    throw new Error('Delete Results not yet implemented');
  };
  switch (backend) {
    case 'rest':
      SubmitQuery(query, dispatch, callback);
      break;
    case 'electron':
      callback((await runnerAPI.DeleteResults(query)) as Record<string, unknown>);
      break;
    default:
      console.error('Unknown backend: ', backend);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////

const SubmitQuery = (query: Record<string, unknown>, dispatch, callback) => {
  // POST request handler

  const postRequest = async () => {
    const postRequestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      body: JSON.stringify(query),
    };
    console.info('Sending query: ', query);
    fetch(API_ENDPOINT + '/post', postRequestOptions)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        dispatch(runnerUpdateStatusText('Error: ' + response.statusText));
        throw response;
      })
      .then((data) => {
        if (data !== null) processResponse(data, callback);
        console.info('Got response: ', data);
      })
      .catch((error) => {
        console.error('Error during query: ', error);
      });
  };

  const processResponse = (content: JSON, callback) => {
    console.log('Process response: ', content);
    callback(content);
  };

  // Received query request (POST to backend server)...
  if (JSON.stringify(query) !== JSON.stringify({})) postRequest();
};
