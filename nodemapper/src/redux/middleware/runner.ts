import RunnerEngine from "gui/Runner/RunnerEngine";

import { displayCloseSettings } from "redux/actions";
import { displayOpenSettings } from "redux/actions";
import { displayUpdateNodeInfo } from "redux/actions";

import { runnerSubmitQuery } from "redux/actions";
import { runnerQueryJobStatus } from "redux/actions";
import { runnerUpdateStatusText } from "redux/actions";

export function runnerMiddleware({ getState, dispatch }) {
  return function (next) {
    return function (action) {
      // action.type
      //       .payload
      console.log("Middleware: ", action);
      switch (action.type) {
        case "runner/node-selected": {
          const graph_is_moveable = getState().display.graph_is_moveable;
          if (!graph_is_moveable) {
            const runner = RunnerEngine.Instance;
            const node = runner.getNodeById(action.payload.id);
            let payload = {};
            if (node === null) {
              console.debug(
                "Selected node not found in engine: ",
                action.payload.id
              );
              payload = {
                id: action.payload.id,
                name: "ERROR: Failed to find node (" + action.payload.id + ")",
                type: "ERROR: Failed to find node (" + action.payload.id + ")",
                code: "ERROR: Failed to find node (" + action.payload.id + ")",
              };
            } else {
              const json = JSON.parse(node.getOptions().extras);
              payload = {
                id: action.payload.id,
                name: node.getOptions()["name"],
                type: json.type,
                code: json.content,
              };
            }
            dispatch(displayUpdateNodeInfo(JSON.stringify(payload)));
            dispatch(displayOpenSettings());
          }
          break;
        }

        case "runner/node-deselected": {
          dispatch(displayUpdateNodeInfo(""));
          dispatch(displayCloseSettings());
          break;
        }

        case "runner/select-none": {
          // Link to singleton instance of runner graph engine
          const runner = RunnerEngine.Instance;
          runner.NodesSelectNone();
          break;
        }

        case "runner/import-snakefile": {
          QueryAndLoadTextFile((content, filename) => {
            const query: Record<string, unknown> = {
              query: "runner/tokenize",
              data: {
                format: "Snakefile",
                content: content,
              },
            };
            dispatch(runnerSubmitQuery(query));
            dispatch(displayUpdateNodeInfo(""));
          });
          break;
        }

        case "runner/load-snakefile": {
          dispatch(runnerUpdateStatusText("Loading Snakefile..."));
          const query: Record<string, unknown> = {
            query: "runner/tokenize_load",
            data: {
              format: "Snakefile",
              content: action.payload,
            },
          };
          dispatch(runnerSubmitQuery(query));
          dispatch(displayUpdateNodeInfo(""));
          break;
        }

        case "runner/launch-snakefile": {
          const query: Record<string, unknown> = {
            query: "runner/launch",
            data: {
              format: "Snakefile",
              content: JSON.parse(getState().display.folderinfo).foldername,
            },
          };
          dispatch(runnerSubmitQuery(query));
          setTimeout(() => dispatch(runnerQueryJobStatus()), 5000);
          break;
        }

        case "runner/query-job-status": {
          const query: Record<string, unknown> = {
            query: "runner/jobstatus",
            data: {
              format: "Snakefile",
              content: JSON.parse(getState().display.folderinfo).foldername,
            },
          };
          dispatch(runnerSubmitQuery(query));
          setTimeout(() => dispatch(runnerQueryJobStatus()), 1000);
          break;
        }

        case "runner/build-snakefile": {
          const query: Record<string, unknown> = {
            query: "runner/build",
            data: {
              format: "Snakefile",
              content: getState().runner.serialize,
            },
          };
          dispatch(runnerSubmitQuery(query));
          break;
        }

        case "runner/lint-snakefile": {
          const query: Record<string, unknown> = {
            query: "runner/lint",
            data: {
              format: "Snakefile",
              content: getState().runner.serialize,
            },
          };
          dispatch(runnerSubmitQuery(query));
          break;
        }

        case "runner/load-workflow": {
          dispatch(runnerUpdateStatusText("Loading Workflow..."));
          const query: Record<string, unknown> = {
            query: "runner/loadworkflow",
            data: {
              format: "Snakefile",
              content: JSON.parse(getState().display.folderinfo).foldername,
            },
          };
          dispatch(runnerSubmitQuery(query));
          break;
        }

        default:
          break;
      }

      return next(action);
    };
  };
}

function QueryAndLoadTextFile(onLoad: (result, filename: string) => void) {
  // eslint-disable-line @typescript-eslint/ban-types
  // Opens a file dialog, then executes readerEvent
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files[0];
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (readerEvent) =>
      onLoad(readerEvent.target.result, file.name);
  };
  input.click();
}
