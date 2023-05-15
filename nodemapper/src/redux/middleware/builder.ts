import BuilderEngine from 'gui/Builder/BuilderEngine'

import { builderCompileToJson } from 'redux/actions'
import { builderSubmitQuery } from 'redux/actions'
import { builderUpdateStatusText } from 'redux/actions'

import { displayCloseSettings } from 'redux/actions'
import { displayOpenSettings } from 'redux/actions'
import { displayUpdateNodeInfo } from 'redux/actions'

// TODO: Replace with webpack proxy (problems getting this to work)
const API_ENDPOINT = "http://127.0.0.1:5000/api"

export function builderMiddleware({ getState, dispatch }) {
  return function(next) {
    return function(action) {
      // action.type
      //       .payload
      console.log("Middleware: ", action );
      switch (action.type) {

          case "builder/compile-to-json": {
            const app = BuilderEngine.Instance;
            const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
              'query': 'builder/compile-to-json',
              'data': {
                'format': 'Snakefile',
                'content': JSON.stringify(app.GetModuleListJSON())
              }
            }
            SubmitQueryExpectZip(query)
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

          case "builder/get-remote-modules": {
            // Get list of remote modules
            dispatch(builderUpdateStatusText("Loading remote modules..."));
            const app = BuilderEngine.Instance;
            const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
              'query': 'builder/get-remote-modules',
              'data': {
                'format': 'Snakefile',
                'content': JSON.stringify({
                  'url': getState().builder.repo,
                })
              }
            }
            dispatch(builderSubmitQuery(query))
            break;
          }

          case "builder/update-modules-list": {
            // Update list of modules - done in reducer
            dispatch(builderUpdateStatusText(""));
            break;
          }

          default:
            break;
      }

      return next(action)
    }
  }
}

function SubmitQueryExpectZip(query: Record<string, any>) {
  // POST request handler
  async function postRequest() {
    const postRequestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json;charset=UTF-8', 'responseType': 'blob'},
      body: JSON.stringify(query)
    };
    console.info("Sending query: ", query)
    fetch(API_ENDPOINT + '/post', postRequestOptions)
      .then(response => {
        if (response.ok) {
          const reader = response.body.getReader()
          return new ReadableStream({
            start(controller) {
              function push() {
                reader.read().then(({done, value}) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  controller.enqueue(value);
                  push();
                });
              }
              push();
            }
          });
        }
        throw response
      })
      .then((stream) =>
        new Response(stream, {headers: {"Content-type": "application/zip"}
      }).text()
      )
      .then((result) => {
        // Download returned content as file
        const filename = 'workflow'
        const element = document.createElement('a');
        element.setAttribute('href', 'data:application/zip;base64,' +
          encodeURIComponent(result));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      });
  }
  postRequest();
}
