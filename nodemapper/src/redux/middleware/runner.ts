import RunnerEngine from "gui/Runner/RunnerEngine";

import { displayOpenSettings } from "redux/actions";
import { displayGetFolderInfo } from "redux/actions";
import { displayCloseSettings } from "redux/actions";
import { displayUpdateNodeInfo } from "redux/actions";
import { displayStoreFolderInfo } from "redux/actions";

import { runnerStoreMap } from "redux/actions";
import { runnerStoreLint } from "redux/actions";
import { runnerNodeSelected } from "redux/actions";
import { runnerLintSnakefile } from "redux/actions";
import { runnerNodeDeselected } from "redux/actions";
import { runnerQueryJobStatus } from "redux/actions";
import { runnerStoreJobStatus } from "redux/actions";
import { runnerUpdateStatusText } from "redux/actions";

// TODO: Replace with webpack proxy (problems getting this to work)
// only relevant for web-service backend (e.g. flask)
const API_ENDPOINT = "http://127.0.0.1:5000/api";

export function runnerMiddleware({ getState, dispatch }) {
  return function (next) {
    return function (action) {
      // action.type
      //       .payload
      console.log("Middleware: ", action);
      switch (action.type) {
        case "runner/node-selected":
          NodeSelected(action, dispatch, getState);
          break;
        case "runner/node-deselected":
          NodeDeselected(dispatch);
          break;
        case "runner/select-none":
          SelectNone();
          break;
        case "runner/import-snakefile":
          ImportSnakefile(dispatch);
          break;
        case "runner/load-snakefile":
          LoadSnakefile(action, dispatch);
          break;
        case "runner/launch-snakefile":
          LaunchSnakefile(dispatch, getState);
          break;
        case "runner/query-job-status":
          QueryJobStatus(dispatch, getState);
          break;
        case "runner/build-snakefile":
          BuildSnakefile(dispatch, getState);
          break;
        case "runner/lint-snakefile":
          LintSnakefile(dispatch, getState);
          break;
        case "runner/load-workflow":
          LoadWorkflow(dispatch, getState);
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

const NodeSelected = (action, dispatch, getState) => {
  const graph_is_moveable = getState().display.graph_is_moveable;
  if (!graph_is_moveable) {
    const runner = RunnerEngine.Instance;
    const node = runner.getNodeById(action.payload.id);
    let payload = {};
    if (node === null) {
      console.debug("Selected node not found in engine: ", action.payload.id);
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
};

const NodeDeselected = (dispatch) => {
  dispatch(displayUpdateNodeInfo(""));
  dispatch(displayCloseSettings());
};

const SelectNone = () => {
  // Link to singleton instance of runner graph engine
  const runner = RunnerEngine.Instance;
  runner.NodesSelectNone();
};

const ImportSnakefile = (dispatch) => {
  QueryAndLoadTextFile((content, filename) => {
    const query: Record<string, unknown> = {
      query: "runner/tokenize",
      data: {
        format: "Snakefile",
        content: content,
      },
    };
    SubmitQuery(query, dispatch);
    dispatch(displayUpdateNodeInfo(""));
  });
};

const LoadSnakefile = (action, dispatch) => {
  dispatch(runnerUpdateStatusText("Loading Snakefile..."));
  const query: Record<string, unknown> = {
    query: "runner/tokenize_load",
    data: {
      format: "Snakefile",
      content: action.payload,
    },
  };
  SubmitQuery(query, dispatch);
  dispatch(displayUpdateNodeInfo(""));
};

const LaunchSnakefile = (dispatch, getState) => {
  const query: Record<string, unknown> = {
    query: "runner/launch",
    data: {
      format: "Snakefile",
      content: JSON.parse(getState().display.folderinfo).foldername,
    },
  };
  SubmitQuery(query, dispatch);
  setTimeout(() => dispatch(runnerQueryJobStatus()), 5000);
};

const QueryJobStatus = (dispatch, getState) => {
  const query: Record<string, unknown> = {
    query: "runner/jobstatus",
    data: {
      format: "Snakefile",
      content: JSON.parse(getState().display.folderinfo).foldername,
    },
  };
  SubmitQuery(query, dispatch);
  setTimeout(() => dispatch(runnerQueryJobStatus()), 1000);
};

const BuildSnakefile = (dispatch, getState) => {
  const query: Record<string, unknown> = {
    query: "runner/build",
    data: {
      format: "Snakefile",
      content: getState().runner.serialize,
    },
  };
  SubmitQuery(query, dispatch);
};

const LintSnakefile = (dispatch, getState) => {
  const query: Record<string, unknown> = {
    query: "runner/lint",
    data: {
      format: "Snakefile",
      content: getState().runner.serialize,
    },
  };
  SubmitQuery(query, dispatch);
};

const LoadWorkflow = (dispatch, getState) => {
  dispatch(runnerUpdateStatusText("Loading Workflow..."));
  const query: Record<string, unknown> = {
    query: "runner/loadworkflow",
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
    dispatch(runnerUpdateStatusText(""));
    switch (content["query"]) {
      case "runner/build": {
        // Download returned content as file
        const filename = "Snakefile";
        const element = document.createElement("a");
        element.setAttribute(
          "href",
          "data:text/plain;charset=utf-8," + encodeURIComponent(content["body"])
        );
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        break;
      }
      case "runner/launch": {
        console.info("Launch response: ", content["body"]);
        break;
      }
      case "runner/lint": {
        // Update the held linter message
        dispatch(runnerStoreLint(content["body"]));
        break;
      }
      case "runner/jobstatus": {
        dispatch(runnerStoreJobStatus(content["body"]));
        break;
      }
      case "runner/loadworkflow":
      case "runner/tokenize":
      case "runner/tokenize_load": {
        // Rebuild map from returned (segmented) representation
        const nodeMapEngine = RunnerEngine.Instance;
        nodeMapEngine.ConstructMapFromBlocks(JSON.parse(content["body"]));
        dispatch(runnerStoreMap(content["body"]));
        nodeMapEngine.AddSelectionListeners(
          (x) => {
            dispatch(runnerNodeSelected(x));
          },
          (x) => {
            dispatch(runnerNodeDeselected(x));
          },
          (x) => {
            return;
          }
        );
        // Submit query to automatically lint file
        dispatch(runnerLintSnakefile());
        break;
      }
      case "display/folderinfo": {
        // Read folder contents into state
        dispatch(displayStoreFolderInfo(content["body"]));
        break;
      }
      case "runner/deleteresults": {
        // Refresh folder list
        dispatch(displayGetFolderInfo());
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
