import { nodemapSelectNone } from '../actions'
import NodeMapEngine from '../../gui/NodeMapEngine'

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
          default:
            break;
      }

      return next(action)
    }
  }
}
