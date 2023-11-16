import React from "react";
import BuilderEngine from "gui/Builder/BuilderEngine";
import * as globals from "redux/globals";

import { DefaultPortModel } from "NodeMap";
import { DefaultLinkModel } from "NodeMap";
import { DefaultNodeModel } from "NodeMap";

import { builderRedraw } from "redux/actions";
import { builderSetNodes } from "redux/actions";
import { builderLogEvent } from "redux/actions";
import { builderBuildAsModule } from "redux/actions";
import { builderBuildAsWorkflow } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";
import { builderUpdateNodeInfo } from "redux/actions";
import { builderUpdateStatusText } from "redux/actions";
import { builderUpdateModulesList } from "redux/actions";
import { builderSetSettingsVisibility } from "redux/actions";

import { Node } from "reactflow";
import { Edge } from "reactflow";
import { getNodeById } from "gui/Builder/components/Flow";
import { setNodeName } from "gui/Builder/components/Flow";
import { setNodeWorkflow } from "gui/Builder/components/Flow";

type Query = Record<string, unknown>;

const API_ENDPOINT = globals.getApiEndpoint();

const builderAPI = window.builderAPI;
const runnerAPI = window.runnerAPI;
const backend = globals.getBackend();

export const builderMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      // action.type, action.payload
      if (action.type.split("/")[0] === "builder") {
        console.log("Middleware [builder]: ", action);
      }
      switch (action.type) {
        case "builder/build-as-module":
          BuildAs(
            "builder/build-as-module",
            builderAPI.BuildAsModule,
            dispatch,
            getState().builder.snakemake_args,
            getState().builder.snakemake_backend,
            getState().builder.conda_backend,
            getState().builder.environment_variables,
            getState().builder.nodes,
            getState().builder.edges,
          );
          break;

        case "builder/build-as-workflow":
          BuildAs(
            "builder/build-as-workflow",
            builderAPI.BuildAsWorkflow,
            dispatch,
            getState().builder.snakemake_args,
            getState().builder.snakemake_backend,
            getState().builder.conda_backend,
            getState().builder.environment_variables,
            getState().builder.nodes,
            getState().builder.edges,
          );
          break;

        case "builder/build-and-run":
          BuildAndRun(
            dispatch,
            getState().builder.snakemake_args,
            getState().builder.snakemake_backend,
            getState().builder.conda_backend,
            getState().builder.environment_variables,
            getState().builder.nodes,
            getState().builder.edges,
          );
          break;

        case "builder/clean-build-folder":
          CleanBuildFolder(dispatch);
          break;

        case "builder/redraw":
          Redraw();
          break;

        case "builder/add-link":
          AddLink(
            action,
            getState().builder.auto_validate_connections,
            getState().builder.snakemake_backend,
            dispatch
          );
          break;

        case "builder/check-node-dependencies":
          CheckNodeDependencies(
            action.payload,
            dispatch,
            getState().builder.snakemake_backend
          );
          break;

        case "builder/node-deselected":
          NodeDeselected(dispatch);
          break;

        case "builder/update-node-info-key":
          UpdateNodeInfoKey(
            action,
            dispatch,
            JSON.parse(getState().builder.nodeinfo),
            getState().builder.nodes,
          );
          break;

        case "builder/update-node-info-name":
          UpdateNodeInfoName(
            action,
            dispatch,
            JSON.parse(getState().builder.nodeinfo),
            getState().builder.nodes,
          );
          break;

        case "builder/get-remote-modules":
          GetRemoteModules(dispatch, JSON.parse(getState().builder.repo));
          break;

        case "builder/update-modules-list":
          UpdateModulesList(dispatch);
          break;

        case "builder/set-settings-visibility":
          SetSettingsVisibility(dispatch, action.payload);
          break;

        case "builder/toggle-settings-visibility":
          ToggleSettingsVisibility(dispatch, getState().builder);
          break;

        case "builder/update-status-text":
          UpdateStatusText(dispatch, action.payload);
          break;

        default:
          break;
      }

      return next(action);
    };
  };
};

///////////////////////////////////////////////////////////////////////////////
// Middleware
///////////////////////////////////////////////////////////////////////////////

interface IPayloadRecord {
  payload: Query;
  type: string;
}
type TPayloadRecord = (action: IPayloadRecord) => void;

interface IPayloadString {
  payload: string;
  type: string;
}
type TPayloadString = (action: IPayloadString) => void;

interface IPayloadBool {
  payload: boolean;
  type: string;
}
type TPayloadBool = (action: IPayloadBool) => void;

const BuildAs = async (
  query_name: string,
  builder_api_fcn: (query: Query) => Promise<Query>,
  dispatchString: TPayloadString,
  snakemake_args: string,
  snakemake_backend: string,
  conda_backend: string,
  environment_variables: string,
  nodes: Node[],
  edges: Edge[],
) => {
  dispatchString(builderUpdateStatusText("Building workflow..."));
  const app = BuilderEngine.Instance;
  const query: Query = {
    query: query_name,
    data: {
      format: "Snakefile",
      content: app.GetModuleListJSON(nodes, edges),
      targets: app.GetLeafNodeNames(),
      args: snakemake_args,
      backend: snakemake_backend,
      conda_backend: conda_backend,
      environment_variables: environment_variables,
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
    // Report success (this should be returned by the backend, but that is currently
    // set-up to return the [binary] zip file); console.logs are important for
    // post-build tests
    console.log({ query: query["query"], returncode: 0 });
    // Update status
    dispatchString(builderUpdateStatusText(" ")); // Idle
  };
  switch (backend as string) {
    case "rest":
      query["data"]["content"] = JSON.stringify(query["data"]["content"]);
      SubmitQueryExpectZip(query, callback);
      break;
    case "electron":
      callback(await builder_api_fcn(query));
      break;
    default:
      console.error("Unknown backend: ", backend);
  }
};

const BuildAndRun = async (
  dispatchString: TPayloadString,
  snakemake_args: string,
  snakemake_backend: string,
  conda_backend: string,
  environment_variables: string,
  nodes: Node[],
  edges: Edge[],
) => {
  dispatchString(
    builderUpdateStatusText("Building workflow and launching a test run...")
  );
  const app = BuilderEngine.Instance;
  const query: Query = {
    query: "builder/build-and-run",
    data: {
      format: "Snakefile",
      content: app.GetModuleListJSON(nodes, edges),
      targets: app.GetLeafNodeNames(),
      args: snakemake_args,
      backend: snakemake_backend,
      conda_backend: conda_backend,
      environment_variables: environment_variables,
    },
  };
  const callback = (content: Query) => {
    console.log(content);
    if (content["returncode"] !== 0) {
      // Report error
      dispatchString(builderUpdateStatusText("Workflow run FAILED."));
      return;
    }
    dispatchString(builderUpdateStatusText(" ")); // Idle
  };
  switch (backend as string) {
    case "rest":
      query["data"]["content"] = JSON.stringify(query["data"]["content"]);
      SubmitQuery(query, dispatchString, callback);
      break;
    case "electron":
      callback(await builderAPI.BuildAndRun(query));
      break;
    default:
      console.error("Unknown backend: ", backend);
  }
};

const CleanBuildFolder = async (dispatchString: TPayloadString) => {
  const app = BuilderEngine.Instance;
  const query: Query = {
    query: "builder/clean-build-folder",
    data: {
      format: "Snakefile",
      content: {
        path: "", // Path currently set in builder package
      },
    },
  };
  const callback = (result) => {
    console.log(result);
  };
  switch (backend as string) {
    case "rest":
      query["data"]["content"] = JSON.stringify(query["data"]["content"]);
      SubmitQuery(query, dispatchString, callback);
      break;
    case "electron":
      callback(await builderAPI.CleanBuildFolder(query));
      break;
    default:
      console.error("Unknown backend: ", backend);
  }
};

const Redraw = () => {
  const app = BuilderEngine.Instance;
  app.engine.repaintCanvas();
};

interface IPayloadLink {
  payload: DefaultLinkModel; // Non-serialisable object; consider alternatives
}
const AddLink = async (
  action: IPayloadLink,
  auto_validate_connections: boolean,
  snakemake_backend: string,
  dispatch: TPayloadString
) => {
  // Skip check if auto-validation is disabled
  if (!auto_validate_connections) {
    return;
  }
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

  // Check node dependencies
  CheckNodeDependencies(nodename, dispatch, snakemake_backend);
};

const CheckNodeDependencies = async (
  nodename: string,
  dispatch: TPayloadString,
  snakemake_backend: string
) => {
  // Identify all incoming connections to the Target node and build
  //  a JSON Builder object, given it's immediate dependencies
  throw new Error("Not implemented");

  /*
  const app = BuilderEngine.Instance;
  const node = app.getNodeByName(nodename) as DefaultNodeModel;
  const inputNodes = app.nodeScene.getNodeInputNodes(node);
  const depNodeNames = Object.values(inputNodes) as string[];
  depNodeNames.unshift(nodename);
  const jsDeps = app.nodeScene.getModuleListJSONFromNodeNames(depNodeNames);

  // Submit Build request
  const query: Query = {
    query: "runner/check-node-dependencies",
    data: {
      format: "Snakefile",
      content: JSON.stringify(jsDeps),
      backend: snakemake_backend,
    },
  };
  // Set node grey to indicate checking
  const node_type = app.getProperty(node, "type");
  node.getOptions().color = "rgb(192,192,192)";
  app.engine.repaintCanvas();

  const callback = (data: Query) => {
    dispatch(builderUpdateStatusText(""));
    console.log(data);
    switch (data["body"]["status"]) {
      case "ok":
        node.getOptions().color = BuilderEngine.GetModuleTypeColor(node_type);
        break;
      case "missing":
        node.getOptions().color = "red";
        break;
      default:
        console.error("Unexpected response: ", data["body"]);
    }
    app.engine.repaintCanvas();
    dispatch(builderRedraw());
  };
  switch (backend as string) {
    case "rest":
      // query["data"]["content"] = JSON.stringify(query["data"]["content"]);
      postRequestCheckNodeDependencies(query, dispatch, callback);
      break;
    case "electron":
      callback(await runnerAPI.CheckNodeDependencies(query));
      break;
    default:
      console.error("Unknown backend: ", backend);
  }
  */
};

interface INodeDeselectedDispatch {
  payload: string;
}
type TNodeDeselectedDispatch = (action: INodeDeselectedDispatch) => void;

const NodeDeselected = (dispatch: TNodeDeselectedDispatch) => {
  dispatch(builderUpdateNodeInfo(""));
};

const UpdateNodeInfoKey = (
  action: IPayloadRecord,
  dispatch,
  nodeinfo,
  nodes: Node[],
): void => {
  // Update field for node
  console.log("Middleware: UpdateNodeInfoKey");
  const node = getNodeById(nodeinfo.id, nodes) as Node;
  if (node !== null) {
    const workflow = JSON.parse(JSON.stringify(node.data.config.config));
    const keys = action.payload.keys as string[];
    const indexInto = (obj, indexlist, value) => {
      if (indexlist.length == 1) {
        obj[indexlist[0]] = value;
      } else {
        return indexInto(obj[indexlist[0]], indexlist.slice(1), value);
      }
    };
    indexInto(workflow, keys, action.payload.value);
    const newnodes = setNodeWorkflow(nodes, node.id, workflow);
    if (newnodes !== null)
      dispatch(builderSetNodes(newnodes));
    else
      console.error("Failed to update node workflow: ", nodeinfo, workflow);
  } else {
    console.log("Node not found: ", nodeinfo);
  }
};

const UpdateNodeInfoName = (
  action: IPayloadString,
  dispatch,
  nodeinfo,
  nodes: Node[],
): void => {
  // Update field for node
  console.log("Middleware: UpdateNodeInfoName");
  const builder = BuilderEngine.Instance;
  const node = getNodeById(nodeinfo.id, nodes) as Node;
  if (node !== null) {
    //const name = builder.EnsureUniqueName(action.payload);  // TODO: Check for uniqueness
    const name = action.payload;

    const newnodes = setNodeName(nodes, node.id, name);
    if (newnodes !== null)
      dispatch(builderSetNodes(newnodes));
    else
      console.error("Failed to update node name: ", nodeinfo, name);
  } else {
    console.log("Node not found: ", nodeinfo);
  }
};

const GetRemoteModules = async (
  dispatchString: TPayloadString,
  repo: string
) => {
  // Get list of remote modules
  dispatchString(builderUpdateStatusText("Loading modules..."));
  console.log("Repository settings: ", repo);
  const app = BuilderEngine.Instance;
  const query: Query = {
    query: "builder/get-remote-modules",
    data: {
      format: "Snakefile",
      content: {
        url: repo,
      },
    },
  };
  const callback = (content: Query) => {
    console.log(content);
    if (content["returncode"] !== 0) {
      // Report error
      dispatchString(builderUpdateStatusText(content["body"] as string));
    } else {
      dispatchString(builderUpdateStatusText("Modules loaded."));
      dispatchString(builderUpdateModulesList(content["body"] as string));
    }
  };
  let response: Record<string, undefined>;
  switch (backend as string) {
    case "rest":
      query["data"]["content"] = JSON.stringify(query["data"]["content"]);
      SubmitQuery(query, dispatchString, callback);
      break;
    case "electron":
      callback(await builderAPI.GetRemoteModules(query));
      break;
    default:
      console.error("Unknown backend: ", backend);
  }
};

const UpdateModulesList = (dispatch: TPayloadString) => {
  // Update list of modules - done in reducer
  dispatch(builderUpdateStatusText(""));
};

///////////////////////////////////////////////////////////////////////////////
// POST request handlers
///////////////////////////////////////////////////////////////////////////////

const SubmitQueryExpectZip = (
  query: Query,
  callback: (content: unknown) => void
) => {
  // POST request handler
  const postZIPRequest = async () => {
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
              const push = () => {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  controller.enqueue(value);
                  push();
                });
              };
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
  };
  postZIPRequest();
};

const postRequestCheckNodeDependencies = async (
  query: Query,
  dispatch: TPayloadString,
  callback: (data: Query) => void
) => {
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
};

const SubmitQuery = (query: Query, dispatch, callback) => {
  // POST request handler
  const postRequest = async () => {
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
  };

  const processResponse = (content: JSON, callback) => {
    console.log("Process response: ", content);
    dispatch(builderUpdateStatusText(""));
    callback(content);
  };

  // Received query request
  if (JSON.stringify(query) !== JSON.stringify({})) postRequest();
};

const SetSettingsVisibility = (
  dispatch: TPayloadString,
  new_state: boolean
) => {
  if (new_state) {
    // Close node info pane
    dispatch(builderNodeDeselected(""));
    const app = BuilderEngine.Instance;
    app.DeselectAll();
  }
  return 0;
};

const ToggleSettingsVisibility = (dispatch: TPayloadString, state: Query) => {
  SetSettingsVisibility(dispatch, !state.settings_visible);
};

const UpdateStatusText = (dispatch: TPayloadString, text: string) => {
  // Send a copy of the status text to the logger
  dispatch(builderLogEvent(text));
};
