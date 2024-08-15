import { displayStoreFolderInfo, runnerSelectNone } from 'redux/actions';
import { IState } from 'redux/reducers';

const displayAPI = window.displayAPI;

export const displayMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      console.debug(action);
      const state = getState() as IState;
      switch (action.type) {
        case 'display/close-settings':
          CloseSettings(dispatch);
          break;
        case 'display/get-folder-info':
          GetFolderInfo(dispatch, state.display);
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

const GetFolderInfo = async (dispatch, display: IState['display']) => {
  const query: Record<string, unknown> = {
    query: 'display/folderinfo',
    data: {
      content: JSON.parse(display.folderinfo).foldername,
    },
  };
  const callback = (content) => {
    // Read folder contents into state
    dispatch(displayStoreFolderInfo(content['body']));
  };
  callback((await displayAPI.FolderInfo(query)) as Record<string, unknown>);
};
