import BuilderEngine from "gui/Builder/BuilderEngine";
import * as globals from "redux/globals";

import { DefaultPortModel } from "NodeMap";
import { DefaultLinkModel } from "NodeMap";
import { DefaultNodeModel } from "NodeMap";

import { builderRedraw } from "redux/actions";
import { builderCompileToJson } from "redux/actions";
import { builderUpdateNodeInfo } from "redux/actions";
import { builderUpdateStatusText } from "redux/actions";
import { builderUpdateModulesList } from "redux/actions";

const API_ENDPOINT = globals.getApiEndpoint();

// TODO
// This line permits any function declarations from the window.builderAPI
// as a workaround. Remove this in favour of a proper typescript-compatible
// interface. This may require modification to the electron code.
declare const window: any;

const builderAPI = window.builderAPI;
const runnerAPI = window.runnerAPI;
const backend = globals.getBackend();

export function builderMiddleware({ getState, dispatch }) {
  return function (next) {
    return function (action) {
      // action.type, action.payload
      console.log("Middleware: ", action);
      switch (action.type) {
        case "builder/compile-to-json":
          CompileToJSON();
          break;
        case "builder/redraw":
          Redraw();
          break;
        case "builder/add-link":
          AddLink(action, dispatch);
          break;
        case "builder/node-selected":
          NodeSelected(action, dispatch);
          break;
        case "builder/node-deselected":
          NodeDeselected(dispatch);
          break;
        case "builder/get-remote-modules":
          GetRemoteModules(dispatch, JSON.parse(getState().builder.repo));
          break;
        case "builder/update-modules-list":
          UpdateModulesList(dispatch);
          break;
        case "builder/import-module":
          ImportModule();
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

interface IPayloadRecord {
  payload: Record<string, unknown>;
  type: string;
}
type TPayloadRecord = (action: IPayloadRecord) => void;

interface IPayloadString {
  payload: string;
  type: string;
}
type TPayloadString = (action: IPayloadString) => void;

const CompileToJSON = async () => {
  const app = BuilderEngine.Instance;
  const query: Record<string, unknown> = {
    query: "builder/compile-to-json",
    data: {
      format: "Snakefile",
      content: app.GetModuleListJSON(),
    },
  };
  const callback = (result) => {
    // Download returned content as file
    const filename = "build.zip";
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:application/zip;base64," + encodeURIComponent(result)
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  switch (backend as string) {
    case "rest":
      query["data"]["content"] = JSON.stringify(query["data"]["content"]);
      SubmitQueryExpectZip(query, callback);
      break;
    case "electron":
      callback(await builderAPI.CompileToJson(query));
      break;
    default:
      console.error("Unknown backend: ", backend);
  }
};

function Redraw() {
  const app = BuilderEngine.Instance;
  app.engine.repaintCanvas();
}

interface IPayloadLink {
  payload: DefaultLinkModel; // Non-serialisable object; consider alternatives
}
const AddLink = async (action: IPayloadLink, dispatch: TPayloadString) => {
  // Determine which is the input (vs output) port (ordering is drag-dependent)
  const app = BuilderEngine.Instance;
  const link = action.payload;
  let targetPort = null;
  if ((link.getTargetPort() as DefaultPortModel).isIn()) {
    targetPort = link.getTargetPort() as DefaultPortModel;
  } else {
    targetPort = link.getSourcePort() as DefaultPortModel;
  }
  const node = targetPort.getParent();
  const nodename = JSON.parse(node.getOptions().extras)["name"];

  // Identify all incoming connections to the Target node and build
  //  a JSON Builder object, given it's immediate dependencies
  const inputNodes = app.nodeScene.getNodeInputNodes(node);
  const depNodeNames = Object.values(inputNodes) as string[];
  depNodeNames.unshift(nodename);
  const jsDeps = app.nodeScene.getModuleListJSONFromNodeNames(depNodeNames);

  // Submit Build request
  const query: Record<string, unknown> = {
    query: "runner/check-node-dependencies",
    data: {
      format: "Snakefile",
      content: JSON.stringify(jsDeps),
    },
  };
  const callback = (data: Record<string, unknown>) => {
    dispatch(builderUpdateStatusText(""));
    console.log(data);
    switch (data["body"]["status"]) {
      case "ok":
        node.getOptions().color = "rgb(0,192,255)";
        break;
      case "missing":
        node.getOptions().color = "red";
        break;
      default:
        console.error("Unexpected response: ", data["body"]);
    }
    dispatch(builderRedraw());
  };
  switch (backend as string) {
    case "rest":
      query["data"]["content"] = JSON.stringify(query["data"]["content"]);
      postRequestCheckNodeDependencies(query, dispatch, callback);
      break;
    case "electron":
      callback(await runnerAPI.CheckNodeDependencies(query));
      break;
    default:
      console.error("Unknown backend: ", backend);
  }
};

function NodeSelected(action: IPayloadRecord, dispatch: TPayloadString) {
  const builder = BuilderEngine.Instance;
  const id = (action.payload as Record<string, string>).id;
  const node = builder.getNodeById(id);
  let payload = {};
  if (node === null) {
    console.error("Selected node not found in engine: ", action.payload.id);
    payload = {
      id: action.payload.id,
      name: "ERROR: Failed to find node (" + id + ")",
      type: "ERROR: Failed to find node (" + id + ")",
      code: "ERROR: Failed to find node (" + id + ")",
    };
  } else {
    const json = JSON.parse(node.getOptions().extras);
    payload = {
      id: action.payload.id,
      name: node.getOptions()["name"],
      type: json.type,
      code: JSON.stringify(json.config, null, 2),
    };
  }
  dispatch(builderUpdateNodeInfo(JSON.stringify(payload)));
}

interface INodeDeselectedDispatch {
  payload: string;
}
type TNodeDeselectedDispatch = (action: INodeDeselectedDispatch) => void;

function NodeDeselected(dispatch: TNodeDeselectedDispatch) {
  dispatch(builderUpdateNodeInfo(""));
}

async function GetRemoteModules(dispatchString: TPayloadString, repo: string) {
  // Get list of remote modules
  dispatchString(builderUpdateStatusText("Loading remote modules..."));
  const app = BuilderEngine.Instance;
  const query: Record<string, unknown> = {
    query: "builder/get-remote-modules",
    data: {
      format: "Snakefile",
      content: {
        url: repo,
      },
    },
  };
  const callback = (content: string) => {
    dispatchString(builderUpdateModulesList(content["body"]));
  };
  let response: Record<string, undefined>;
  switch (backend as string) {
    case "rest":
      query["data"]["content"] = JSON.stringify(query["data"]["content"]);
      SubmitQuery(query, dispatchString, callback);
      break;
    case "electron":
      callback((await builderAPI.GetRemoteModules(query)) as string);
      break;
    default:
      console.error("Unknown backend: ", backend);
  }
}

function UpdateModulesList(dispatch: TPayloadString) {
  // Update list of modules - done in reducer
  dispatch(builderUpdateStatusText(""));
}

function ImportModule() {
  // Query user for config file and import module
}

///////////////////////////////////////////////////////////////////////////////
// POST request handlers
///////////////////////////////////////////////////////////////////////////////

function SubmitQueryExpectZip(
  query: Record<string, unknown>,
  callback: (content: unknown) => void
) {
  // POST request handler
  async function postZIPRequest() {
    const postRequestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        responseType: "blob",
      },
      body: JSON.stringify(query),
    };
    console.info("Sending query: ", query);
    fetch(API_ENDPOINT + "/post", postRequestOptions)
      .then((response) => {
        if (response.ok) {
          const reader = response.body.getReader();
          return new ReadableStream({
            start(controller) {
              function push() {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  controller.enqueue(value);
                  push();
                });
              }
              push();
            },
          });
        }
        throw response;
      })
      .then((stream) =>
        new Response(stream, {
          headers: { "Content-type": "application/zip" },
        }).text()
      )
      .then((result) => {
        callback(result);
      });
  }
  postZIPRequest();
}

async function postRequestCheckNodeDependencies(
  query: Record<string, unknown>,
  dispatch: TPayloadString,
  callback: (data: Record<string, unknown>) => void
) {
  const postRequestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=UTF-8" },
    body: JSON.stringify(query),
  };
  console.info("Sending query: ", query);
  dispatch(builderUpdateStatusText("Checking node dependencies..."));
  fetch(API_ENDPOINT + "/post", postRequestOptions)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      console.error("Error: " + response.statusText);
      dispatch(builderUpdateStatusText("Error: " + response.statusText));
      throw response;
    })
    .then((data) => {
      console.info("Got response: ", data);
      callback(data);
    })
    .catch((error) => {
      console.error("Error during query: ", error);
    });
}

const SubmitQuery = (query: Record<string, unknown>, dispatch, callback) => {
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
        dispatch(builderUpdateStatusText("Error: " + response.statusText));
        throw response;
      })
      .then((data) => {
        if (data !== null) {
          processResponse(data, callback);
        }
        console.info("Got response: ", data);
      })
      .catch((error) => {
        console.error("Error during query: ", error);
      });
  }

  function processResponse(content: JSON, callback) {
    console.log("Process response: ", content);
    dispatch(builderUpdateStatusText(""));
    callback(content);
  }

  // Received query request
  if (JSON.stringify(query) !== JSON.stringify({})) postRequest();
};
