import { runnerSelectNone } from "redux/actions";
import { runnerSubmitQuery } from "redux/actions";
import RunnerEngine from "gui/Runner/RunnerEngine";

export function displayMiddleware({ getState, dispatch }) {
  return function (next) {
    return function (action) {
      console.debug(action);
      switch (action.type) {
        case "display/close-settings": {
          dispatch(runnerSelectNone());
          break;
        }

        case "display/zoom-to-fit": {
          const runner = RunnerEngine.Instance;
          runner.ZoomToFit();
          break;
        }

        case "display/get-folder-info": {
          const query: Record<string, unknown> = {
            query: "display/folderinfo",
            data: {
              content: JSON.parse(getState().display.folderinfo).foldername,
            },
          };
          dispatch(runnerSubmitQuery(query));
          break;
        }

        case "display/delete-results": {
          const query: Record<string, unknown> = {
            query: "runner/deleteresults",
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
