import { builderCompileToJson } from 'redux/actions'
import { builderSubmitQuery } from 'redux/actions'
import BuilderEngine from 'gui/Builder/BuilderEngine'

import { displayCloseSettings } from 'redux/actions'
import { displayOpenSettings } from 'redux/actions'
import { displayUpdateNodeInfo } from 'redux/actions'

export function builderMiddleware({ getState, dispatch }) {
  return function(next) {
    return function(action) {
      // action.type
      //       .payload
      console.log("Middleware: ", action );
      switch (action.type) {

          case "builder/compile-to-json": {
            const app = BuilderEngine.Instance;
            console.log(app.GetModuleListJSON());
            const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
              'query': 'builder/compile-to-json',
              'data': {
                'format': 'Snakefile',
                'content': JSON.stringify(app.GetModuleListJSON())
              }
            }
            dispatch(builderSubmitQuery(query))
            break;
          }

          case "builder/node-selected": {
            const graph_is_moveable = getState().display.graph_is_moveable
            if (!graph_is_moveable) {
              const builder = BuilderEngine.Instance;
              const node = builder.getNodeById(action.payload.id);
              let payload = {}
              if (node === null) {
                console.debug("Selected node not found in engine: ", action.payload.id)
                payload = {
                    id: action.payload.id,
                    name: "ERROR: Failed to find node (" + action.payload.id + ")",
                    type: "ERROR: Failed to find node (" + action.payload.id + ")",
                    code: "ERROR: Failed to find node (" + action.payload.id + ")",
                }
              } else {
                const json = JSON.parse(node.options.extras);
                payload = {
                  id: action.payload.id,
                    name: node.options.name,
                    type: json.type,
                  code: JSON.stringify(json.config, null, 2),
                }
              }
              dispatch(displayUpdateNodeInfo(JSON.stringify(payload)));
              // dispatch(displayOpenSettings());
            }
            break;
          }

          case "builder/node-deselected": {
            dispatch(displayUpdateNodeInfo(""));
            // dispatch(displayCloseSettings());
            break;
          }

          default:
            break;
      }

      return next(action)
    }
  }
}
