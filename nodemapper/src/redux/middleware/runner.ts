import RunnerEngine from "gui/Runner/RunnerEngine";
import * as globals from "redux/globals";

import { displayGetFolderInfo } from "redux/actions";
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

const API_ENDPOINT = globals.getApiEndpoint();

export function runnerMiddleware({ getState, dispatch }) {
  return function (next) {
    return function (action) {
      // action.type
      //       .payload
      console.log("Middleware: ", action);
      switch (action.type) {
        case "runner/node-selected":
          NodeSelected(action, dispatch, getState().display.graph_is_moveable);
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
          LaunchSnakefile(dispatch, getState().display.folderinfo);
          break;
        case "runner/query-job-status":
          QueryJobStatus(dispatch, getState().display.folderinfo);
          break;
        case "runner/build-snakefile":
          BuildSnakefile(dispatch, getState().runner.serialize);
          break;
        case "runner/lint-snakefile":
          LintSnakefile(dispatch, getState().runner.serialize);
          break;
        case "runner/load-workflow":
          LoadWorkflow(dispatch, getState().display.folderinfo);
          break;
        case "runner/delete-results":
          DeleteResults(dispatch, getState().display.folderinfo);
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

const NodeSelected = (action, dispatch, graph_is_moveable: boolean): void => {
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
  }
};

const NodeDeselected = (dispatch): void => {
  dispatch(displayUpdateNodeInfo(""));
};

const SelectNone = () => {
  // Link to singleton instance of runner graph engine
  const runner = RunnerEngine.Instance;
  runner.NodesSelectNone();
};

const ImportSnakefile = (dispatch): void => {
  QueryAndLoadTextFile((content, filename) => {
    const query: Record<string, unknown> = {
      query: "runner/tokenize",
      data: {
        format: "Snakefile",
        content: content,
      },
    };
    const callback = (content: Record<string, unknown>) => {
      RebuildNodeMap(content, dispatch);
    };
    SubmitQuery(query, dispatch, callback);
    dispatch(displayUpdateNodeInfo(""));
  });
};

const LoadSnakefile = (action, dispatch): void => {
  dispatch(runnerUpdateStatusText("Loading Snakefile..."));
  const query: Record<string, unknown> = {
    query: "runner/tokenize_load",
    data: {
      format: "Snakefile",
      content: action.payload,
    },
  };
  const callback = (content: Record<string, unknown>) => {
    RebuildNodeMap(content, dispatch);
  };
  SubmitQuery(query, dispatch, callback);
  dispatch(displayUpdateNodeInfo(""));
};

const LaunchSnakefile = (dispatch, folderinfo: string): void => {
  const query: Record<string, unknown> = {
    query: "runner/launch",
    data: {
      format: "Snakefile",
      content: JSON.parse(folderinfo).foldername,
    },
  };
  const callback = (content: Record<string, unknown>) => {
    console.info("Launch response: ", content["body"]);
  };
  SubmitQuery(query, dispatch, callback);
  setTimeout(() => dispatch(runnerQueryJobStatus()), 5000);
};

const QueryJobStatus = (dispatch, folderinfo: string): void => {
  const query: Record<string, unknown> = {
    query: "runner/jobstatus",
    data: {
      format: "Snakefile",
      content: JSON.parse(folderinfo).foldername,
    },
  };
  const callback = (content: Record<string, unknown>) => {
    dispatch(runnerStoreJobStatus(content["body"] as string));
  };
  SubmitQuery(query, dispatch, callback);
  setTimeout(() => dispatch(runnerQueryJobStatus()), 1000);
};

const BuildSnakefile = (dispatch, serial: string): void => {
  const query: Record<string, unknown> = {
    query: "runner/build",
    data: {
      format: "Snakefile",
      content: serial,
    },
  };
  const callback = (content: Record<string, unknown>) => {
    // Download returned content as file
    const filename = "Snakefile";
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," +
        encodeURIComponent(content["body"] as string)
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  SubmitQuery(query, dispatch, callback);
};

const LintSnakefile = (dispatch, serial: string): void => {
  const query: Record<string, unknown> = {
    query: "runner/lint",
    data: {
      format: "Snakefile",
      content: serial,
    },
  };
  const callback = (content: Record<string, unknown>) => {
    dispatch(runnerStoreLint(content["body"] as string));
  };
  SubmitQuery(query, dispatch, callback);
};

const LoadWorkflow = (dispatch, folderinfo: string): void => {
  dispatch(runnerUpdateStatusText("Loading Workflow..."));
  const query: Record<string, unknown> = {
    query: "runner/loadworkflow",
    data: {
      format: "Snakefile",
      content: JSON.parse(folderinfo).foldername,
    },
  };
  const callback = (content: Record<string, unknown>) => {
    RebuildNodeMap(content, dispatch);
  };
  SubmitQuery(query, dispatch, callback);
};

const DeleteResults = (dispatch, folderinfo: string): void => {
  dispatch(runnerUpdateStatusText("Deleting Results..."));
  const query: Record<string, unknown> = {
    query: "runner/deleteresults",
    data: {
      format: "Snakefile",
      content: JSON.parse(folderinfo).foldername,
    },
  };
  const callback = (content: Record<string, unknown>) => {
    // Refresh folder list
    dispatch(displayGetFolderInfo());
  };
  SubmitQuery(query, dispatch, callback);
};

///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////

const RebuildNodeMap = (content: Record<string, any>, dispatch): void => {
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
};

function QueryAndLoadTextFile(
  onLoad: (result, filename: string) => void
): void {
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

function SubmitQuery(
  query: Record<string, unknown>,
  dispatch,
  callback: (content: Record<string, unknown>) => void
): void {
  // POST request handler
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
        if (data !== null) processResponse(data, callback);
        console.info("Got response: ", data);
      })
      .catch((error) => {
        console.error("Error during query: ", error);
      });
  }

  function processResponse(content: Record<string, unknown>, callback) {
    console.log("Process response: ", content);
    dispatch(runnerUpdateStatusText(""));
    callback(content);
  }

  // Received query request (POST to backend server)...
  if (JSON.stringify(query) !== JSON.stringify({})) postRequest();
}
