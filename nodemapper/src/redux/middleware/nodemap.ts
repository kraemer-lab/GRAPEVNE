import { displayCloseSettings } from '../actions'
import { displayOpenSettings } from '../actions'
import { displayUpdateNodeInfo } from '../actions'
import { nodemapSubmitQuery } from '../actions'
import { nodemapQueryJobStatus } from '../actions'

import NodeMapEngine from '../../gui/NodeMapEngine'

export function nodemapMiddleware({ getState, dispatch }) {
  return function(next) {
    return function(action) {
      // action.type
      //       .payload
      console.log("Middleware: ", action );
      switch (action.type) {

          case "nodemap/node-selected": {
            const graph_is_moveable = getState().display.graph_is_moveable
            if (!graph_is_moveable) {
              const nodemap = NodeMapEngine.Instance;
              const node = nodemap.getNodeById(action.payload.id);
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
                  code: json.content,
                }
              }
              dispatch(displayUpdateNodeInfo(JSON.stringify(payload)));
              dispatch(displayOpenSettings());
            }
            break;
          }

          case "nodemap/node-deselected": {
            dispatch(displayUpdateNodeInfo(""));
            dispatch(displayCloseSettings());
            break;
          }

          case "nodemap/select-none": {
            // Link to singleton instance of nodemap graph engine
            const nodemap = NodeMapEngine.Instance;
            nodemap.NodesSelectNone();
            break;
          }

          case "nodemap/import-snakefile": {
              QueryAndLoadTextFile((content, filename) => {
                  const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
                      'query': 'tokenize',
                      'data': {
                          'format': 'Snakefile',
                          'content': content
                      }
                  }
                  dispatch(nodemapSubmitQuery(query));
                  dispatch(displayUpdateNodeInfo(""));
              });
              break;
          }

          case "nodemap/load-snakefile": {
              const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
                  'query': 'tokenize_load',
                  'data': {
                      'format': 'Snakefile',
                      'content': action.payload
                  }
              }
              dispatch(nodemapSubmitQuery(query));
              dispatch(displayUpdateNodeInfo(""));
              break;
          }

          case "nodemap/launch-snakefile": {
              const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
                  'query': 'launch',
                  'data': {
                      'format': 'Snakefile',
                      'content': getState().display.filename
                  }
              }
              dispatch(nodemapSubmitQuery(query));
              setTimeout(
                () => dispatch(nodemapQueryJobStatus()),
                5000
              );
              break;
          }

          case "nodemap/query-job-status": {
              const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
                  'query': 'jobstatus',
                  'data': {
                      'format': 'Snakefile',
                      'content': getState().display.filename
                  }
              }
              dispatch(nodemapSubmitQuery(query));
              setTimeout(
                () => dispatch(nodemapQueryJobStatus()),
                1000
              );
              break;
          }

          case "nodemap/build-snakefile": {
              const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
                  'query': 'build',
                  'data': {
                      'format': 'Snakefile',
                      'content': getState().nodemap.serialize
                  }
              }
              dispatch(nodemapSubmitQuery(query))
              break;
          }

          case "nodemap/lint-snakefile": {
              const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
                  'query': 'lint',
                  'data': {
                      'format': 'Snakefile',
                      'content': getState().nodemap.serialize
                  }
              }
              dispatch(nodemapSubmitQuery(query))
              break;
          }

          case "nodemap/load_workflow": {
              const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
                  'query': 'loadworkflow',
                  'data': {
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

function QueryAndLoadTextFile(onLoad: Function) {  // eslint-disable-line @typescript-eslint/ban-types
// Opens a file dialog, then executes readerEvent
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = e => {
    console.log(e);
    const file = (e.target as HTMLInputElement).files[0];
    const reader = new FileReader();
    reader.readAsText(file,'UTF-8');
    reader.onload = (readerEvent) => onLoad(readerEvent.target.result, file.name)
  }
  input.click();
}
