import { nodemapSelectNone } from 'redux/actions'
import { nodemapSubmitQuery } from 'redux/actions'
import NodeMapEngine from 'gui/Runner/NodeMapEngine'

export function displayMiddleware({ getState, dispatch }) {
  return function(next) {
    return function(action) {

      console.debug(action);
      switch (action.type) {

          case "display/close-settings": {
            dispatch(nodemapSelectNone());
            break;
          }

          case "display/zoom-to-fit": {
              const nodemap = NodeMapEngine.Instance;
              nodemap.ZoomToFit();
            break;
          }

          case "display/get-folder-info": {
              const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
                  'query': 'folderinfo',
                  'data': {
                      'content': JSON.parse(getState().display.folderinfo).foldername
                  }
              }
              dispatch(nodemapSubmitQuery(query))
              break;
          }

          case "display/delete-results": {
              const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
                  'query': 'deleteresults',
                  'data': {
                      'format': 'Snakefile',
                      'content': JSON.parse(getState().display.folderinfo).foldername
                  }
              }
              dispatch(nodemapSubmitQuery(query))
              break;
          }

          default:
            break;
      }

      return next(action)
    }
  }
}
