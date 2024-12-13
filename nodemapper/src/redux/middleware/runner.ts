import { Query } from 'api';
import { displayGetFolderInfo } from 'redux/actions';
import { IState } from 'redux/reducers';

import { runnerUpdateStatusText } from 'redux/actions';

const runnerAPI = window.runnerAPI;

export const runnerMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      // action.type
      //       .payload
      if (action.type.split('/')[0] === 'runner') {
        console.log('Middleware [runner]: ', action);
      }
      const state = getState() as IState;
      switch (action.type) {
        case 'runner/delete-results':
          DeleteResults(dispatch, state.display.folderinfo);
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
