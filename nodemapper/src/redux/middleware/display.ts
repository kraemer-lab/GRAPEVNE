import { runnerSelectNone } from "redux/actions";
import { runnerUpdateStatusText } from "redux/actions";
import { displayStoreFolderInfo } from "redux/actions";
import RunnerEngine from "gui/Runner/RunnerEngine";

// TODO: Replace with webpack proxy (problems getting this to work)
// only relevant for web-service backend (e.g. flask)
const API_ENDPOINT = "http://127.0.0.1:5000/api";

export function displayMiddleware({ getState, dispatch }) {
  return function (next) {
    return function (action) {
      console.debug(action);
      switch (action.type) {
        case "display/close-settings":
          CloseSettings(dispatch);
          break;
        case "display/zoom-to-fit":
          ZoomToFit();
          break;
        case "display/get-folder-info":
          GetFolderInfo(dispatch, getState);
          break;
        case "display/delete-results":
          DeleteResults(dispatch, getState);
          break;
        default:
          break;
      }
      return next(action);
    };
  };
}

///////////////////////////////////////////////////////////////////////////////
// Middleware
///////////////////////////////////////////////////////////////////////////////

const CloseSettings = (dispatch) => {
  dispatch(runnerSelectNone());
};

const ZoomToFit = () => {
  const runner = RunnerEngine.Instance;
  runner.ZoomToFit();
};

const GetFolderInfo = (dispatch, getState) => {
  const query: Record<string, unknown> = {
    query: "display/folderinfo",
    data: {
      content: JSON.parse(getState().display.folderinfo).foldername,
    },
  };
  SubmitQuery(query, dispatch);
};

const DeleteResults = (dispatch, getState) => {
  const query: Record<string, unknown> = {
    query: "runner/deleteresults",
    data: {
      format: "Snakefile",
      content: JSON.parse(getState().display.folderinfo).foldername,
    },
  };
  SubmitQuery(query, dispatch);
};

///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////

function SubmitQuery(query: Record<string, unknown>, dispatch) {
  // POST request handler [refactor out of this function later]

  async function postRequest() {
    const postRequestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8" },
      body: JSON.stringify(query),
    };
    console.info("Sending query: ", query);
    fetch(API_ENDPOINT + "/post", postRequestOptions)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        dispatch(runnerUpdateStatusText("Error: " + response.statusText));
        throw response;
      })
      .then((data) => {
        if (data !== null) processResponse(data);
        console.info("Got response: ", data);
      })
      .catch((error) => {
        console.error("Error during query: ", error);
      });
  }

  function processResponse(content: JSON) {
    console.log("Process response: ", content);
    switch (content["query"]) {
      case "display/folderinfo": {
        // Read folder contents into state
        dispatch(displayStoreFolderInfo(content["body"]));
        break;
      }
      case "runner/deleteresults": {
        // TODO: Implement
        throw new Error("Delete Results not yet implemented");
        break;
      }
      default:
        console.error(
          "Error interpreting server response (query: ",
          content["query"],
          ")"
        );
    }
  }

  // Received query request (POST to backend server)...
  if (JSON.stringify(query) !== JSON.stringify({})) postRequest();
}
