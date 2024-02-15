import * as globals from 'redux/globals';

import { displayGetFolderInfo } from 'redux/actions';

import { runnerUpdateStatusText } from 'redux/actions';

type Query = Record<string, unknown>;

const API_ENDPOINT = globals.getApiEndpoint();

const runnerAPI = window.runnerAPI;
const backend = globals.getBackend();

export const runnerMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      // action.type
      //       .payload
      if (action.type.split('/')[0] === 'runner') {
        console.log('Middleware [runner]: ', action);
      }
      switch (action.type) {
        case 'runner/delete-results':
          DeleteResults(dispatch, getState().display.folderinfo);
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

const DeleteResults = async (dispatch, folderinfo: string): Promise<void> => {
  dispatch(runnerUpdateStatusText('Deleting Results...'));
  const query: Query = {
    query: 'runner/deleteresults',
    data: {
      format: 'Snakefile',
      content: JSON.parse(folderinfo).foldername,
    },
  };
  const callback = (content: Query) => {
    // Refresh folder list
    dispatch(displayGetFolderInfo());
  };
  switch (backend) {
    case 'rest':
      query['data']['content'] = JSON.stringify(query['data']['content']);
      SubmitQuery(query, dispatch, callback);
      break;
    case 'electron':
      callback((await runnerAPI.LoadWorkflow(query)) as Query);
      break;
    default:
      console.error('Unknown backend: ', backend);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////

const RebuildNodeMap = (content: Query, dispatch): void => {
  throw new Error('Not implemented');

  // Rebuild map from returned (segmented) representation
  /*const nodeMapEngine = RunnerEngine.Instance;
  nodeMapEngine.ConstructMapFromBlocks(JSON.parse(content["body"] as string));
  dispatch(runnerStoreMap(content["body"] as string));
  nodeMapEngine.AddSelectionListeners(
    (x) => {
      // Node selected
      dispatch(runnerNodeSelected(x));
    },
    (x) => {
      // Node deselected
      dispatch(runnerNodeDeselected(x));
    },
    () => {
      // Node deleted
      dispatch(runnerNodeDeselected({}));
    },
    (x) => {
      // Link added
      return;
    }
  );
  // Submit query to automatically lint file
  dispatch(runnerLintSnakefile());*/
};

const QueryAndLoadTextFile = (onLoad: (result, filename: string) => void): void => {
  // eslint-disable-line @typescript-eslint/ban-types
  // Opens a file dialog, then executes readerEvent
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files[0];
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (readerEvent) => onLoad(readerEvent.target.result, file.name);
  };
  input.click();
};

const SubmitQuery = (query: Query, dispatch, callback: (content: Query) => void): void => {
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

  const processResponse = (content: Query, callback) => {
    console.log('Process response: ', content);
    dispatch(runnerUpdateStatusText(''));
    callback(content);
  };

  // Received query request (POST to backend server)...
  if (JSON.stringify(query) !== JSON.stringify({})) postRequest();
};
