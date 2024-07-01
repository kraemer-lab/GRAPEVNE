import { displayStoreFolderInfo, runnerSelectNone } from 'redux/actions';

const displayAPI = window.displayAPI;

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
  callback((await displayAPI.FolderInfo(query)) as Record<string, unknown>);
};
