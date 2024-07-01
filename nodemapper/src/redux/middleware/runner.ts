import { displayGetFolderInfo } from 'redux/actions';

import { runnerUpdateStatusText } from 'redux/actions';

type Query = Record<string, unknown>;

const runnerAPI = window.runnerAPI;

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
  await runnerAPI.LoadWorkflow(query);
  dispatch(displayGetFolderInfo());
};
