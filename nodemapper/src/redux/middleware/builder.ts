import BuilderEngine from 'gui/Builder/components/BuilderEngine';
import * as globals from 'redux/globals';

import {
  builderBuildInProgress,
  builderLogEvent,
  builderNodeSelected,
  builderSetEdges,
  builderSetModulesLoading,
  builderSetNodes,
  builderUpdateModulesList,
  builderUpdateNodeInfo,
  builderUpdateSettings,
  builderUpdateStatusText,
  builderUpdateWorkdir,
} from 'redux/actions';

import { Node } from 'NodeMap/scene/Flow';
import {
  ExportAsPNG,
  ExportAsSVG,
  getNodeById,
  setNodeName,
  setNodeWorkflow,
} from 'gui/Builder/components/Flow';
import { Edge } from 'reactflow';

type Query = Record<string, unknown>;

const API_ENDPOINT = globals.getApiEndpoint();

const displayAPI = window.displayAPI;
const builderAPI = window.builderAPI;
const runnerAPI = window.runnerAPI;
const backend = globals.getBackend();

export const builderMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      // action.type, action.payload
      if (action.type.split('/')[0] === 'builder') {
        console.log('Middleware [builder]: ', action);
      }
      switch (action.type) {
        case 'builder/build-as-module':
          BuildAs({
            query_name: 'builder/build-as-module',
            builder_api_fcn: builderAPI.BuildAsModule,
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: getState().builder.snakemake_args,
            snakemake_backend: getState().builder.snakemake_backend,
            conda_backend: getState().builder.conda_backend,
            environment_variables: getState().builder.environment_variables,
            package_modules: false,
            nodes: getState().builder.nodes,
            edges: getState().builder.edges,
          });
          break;

        case 'builder/build-as-workflow':
          BuildAs({
            query_name: 'builder/build-as-workflow',
            builder_api_fcn: builderAPI.BuildAsWorkflow,
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: getState().builder.snakemake_args,
            snakemake_backend: getState().builder.snakemake_backend,
            conda_backend: getState().builder.conda_backend,
            environment_variables: getState().builder.environment_variables,
            package_modules: false,
            nodes: getState().builder.nodes,
            edges: getState().builder.edges,
          });
          break;

        case 'builder/package-workflow':
          BuildAs({
            query_name: 'builder/build-as-workflow',
            builder_api_fcn: builderAPI.BuildAsWorkflow,
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: getState().builder.snakemake_args,
            snakemake_backend: getState().builder.snakemake_backend,
            conda_backend: getState().builder.conda_backend,
            environment_variables: getState().builder.environment_variables,
            package_modules: true,
            nodes: getState().builder.nodes,
            edges: getState().builder.edges,
          });
          break;

        case 'builder/build-and-run':
          BuildAndRun({
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: getState().builder.snakemake_args,
            snakemake_backend: getState().builder.snakemake_backend,
            conda_backend: getState().builder.conda_backend,
            environment_variables: getState().builder.environment_variables,
            nodes: getState().builder.nodes,
            edges: getState().builder.edges,
          });
          break;

        case 'builder/build-and-run-to-module':
          BuildAndRunToModule({
            nodename: action.payload,
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: getState().builder.snakemake_args,
            snakemake_backend: getState().builder.snakemake_backend,
            conda_backend: getState().builder.conda_backend,
            environment_variables: getState().builder.environment_variables,
            nodes: getState().builder.nodes,
            edges: getState().builder.edges,
          });
          break;

        case 'builder/build-and-force-run-to-module':
          BuildAndForceRunToModule({
            nodename: action.payload,
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: getState().builder.snakemake_args,
            snakemake_backend: getState().builder.snakemake_backend,
            conda_backend: getState().builder.conda_backend,
            environment_variables: getState().builder.environment_variables,
            nodes: getState().builder.nodes,
            edges: getState().builder.edges,
          });
          break;

        case 'builder/clean-build-folder':
          CleanBuildFolder({
            dispatchBool: dispatch,
            dispatchString: dispatch,
          });
          break;

        case 'builder/check-node-dependencies':
          CheckNodeDependencies({
            nodename: action.payload,
            nodes: getState().builder.nodes,
            edges: getState().builder.edges,
            dispatchString: dispatch,
            dispatchNodeList: dispatch,
            snakemake_backend: getState().builder.snakemake_backend,
          });
          break;

        case 'builder/node-selected':
          NodeSelected({
            node: action.payload,
            dispatchString: dispatch,
          });
          break;

        case 'builder/node-selected-by-id':
          NodeSelectedByID({
            id: action.payload,
            nodes: getState().builder.nodes,
            dispatchString: dispatch,
          });
          break;

        case 'builder/node-deselected':
          NodeDeselected(dispatch);
          break;

        case 'builder/update-node-info-key':
          UpdateNodeInfoKey({
            action: action,
            dispatch: dispatch,
            nodeinfo: JSON.parse(getState().builder.nodeinfo),
            nodes: getState().builder.nodes,
          });
          break;

        case 'builder/update-node-info-name':
          UpdateNodeInfoName({
            action: action,
            dispatch: dispatch,
            nodeinfo: JSON.parse(getState().builder.nodeinfo),
            nodes: getState().builder.nodes,
          });
          break;

        case 'builder/get-remote-modules':
          GetRemoteModules({
            dispatchString: dispatch,
            dispatchBool: dispatch,
            repo: getState().builder.repositories,
          });
          break;

        case 'builder/update-modules-list':
          UpdateModulesList(dispatch);
          break;

        case 'builder/update-status-text':
          UpdateStatusText({
            dispatch: dispatch,
            text: action.payload,
          });
          break;

        case 'builder/read-store-config':
          ReadStoreConfig(dispatch);
          break;

        case 'builder/write-store-config':
          WriteStoreConfig(getState().builder);
          break;

        case 'builder/open-results-folder':
          OpenResultsFolder(getState().builder.workdir);
          break;

        case 'builder/load-scene':
          LoadScene({
            dispatchString: dispatch,
            dispatchNodeList: dispatch,
            dispatchEdgeList: dispatch,
          });
          break;

        case 'builder/save-scene':
          SaveScene({
            dispatch: dispatch,
            nodes: getState().builder.nodes,
            edges: getState().builder.edges,
          });
          break;

        case 'builder/export-as-png':
          ExportAsPNG(getState().builder.nodes);
          break;

        case 'builder/export-as-svg':
          ExportAsSVG(getState().builder.nodes);
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

interface IPayloadNodeList {
  payload: Node[];
  type: string;
}
type TPayloadNodeList = (action: IPayloadNodeList) => void;

interface IPayloadEdgeList {
  payload: Edge[];
  type: string;
}
type TPayloadEdgeList = (action: IPayloadEdgeList) => void;

interface IBuildAs {
  query_name: string;
  builder_api_fcn: (query: Query) => Promise<Query>;
  dispatchBool: TPayloadBool;
  dispatchString: TPayloadString;
  snakemake_args: string;
  snakemake_backend: string;
  conda_backend: string;
  environment_variables: string;
  package_modules: boolean;
  nodes: Node[];
  edges: Edge[];
}

const BuildAs = async ({
  query_name,
  builder_api_fcn,
  dispatchBool,
  dispatchString,
  snakemake_args,
  snakemake_backend,
  conda_backend,
  environment_variables,
  package_modules,
  nodes,
  edges,
}: IBuildAs) => {
  dispatchString(builderUpdateStatusText('Building workflow...'));
  dispatchBool(builderBuildInProgress(true));
  const app = BuilderEngine.Instance;
  const query: Query = {
    query: query_name,
    data: {
      format: 'Snakefile',
      content: app.GetModuleListJSON(nodes, edges),
      targets: app.GetLeafNodeNames(nodes, edges),
      args: snakemake_args,
      backend: snakemake_backend,
      conda_backend: conda_backend,
      environment_variables: environment_variables,
      package_modules: package_modules,
    },
  };
  const callback = (result) => {
    // Download returned content as file
    const filename = 'build.zip';
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/zip;base64,' + encodeURIComponent(result));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    // Report success (this should be returned by the backend, but that is currently
    // set-up to return the [binary] zip file); console.logs are important for
    // post-build tests
    console.log({ query: query['query'], returncode: 0 });
    // Update status
    dispatchBool(builderBuildInProgress(false));
    dispatchString(builderUpdateStatusText('')); // Idle
  };
  switch (backend as string) {
    case 'rest':
      query['data']['content'] = JSON.stringify(query['data']['content']);
      SubmitQueryExpectZip({ query, callback });
      break;
    case 'electron':
      callback(await builder_api_fcn(query));
      break;
    default:
      console.error('Unknown backend: ', backend);
  }
};

interface IBuildAndRun {
  dispatchBool: TPayloadBool;
  dispatchString: TPayloadString;
  snakemake_args: string;
  snakemake_backend: string;
  conda_backend: string;
  environment_variables: string;
  nodes: Node[];
  edges: Edge[];
}

const BuildAndRun = async ({
  dispatchBool,
  dispatchString,
  snakemake_args,
  snakemake_backend,
  conda_backend,
  environment_variables,
  nodes,
  edges,
}: IBuildAndRun) => {
  dispatchString(builderUpdateStatusText('Building workflow and launching a test run...'));
  dispatchBool(builderBuildInProgress(true));
  const app = BuilderEngine.Instance;
  const query: Query = {
    query: 'builder/build-and-run',
    data: {
      format: 'Snakefile',
      content: app.GetModuleListJSON(nodes, edges),
      targets: app.GetLeafNodeNames(nodes, edges),
      args: snakemake_args,
      backend: snakemake_backend,
      conda_backend: conda_backend,
      environment_variables: environment_variables,
    },
  };
  const callback = (content: Query) => {
    console.log(content);
    if (content['returncode'] !== 0) {
      // Report error
      dispatchString(builderUpdateStatusText('Workflow run FAILED.'));
      dispatchBool(builderBuildInProgress(false));
      return;
    }
    dispatchString(builderUpdateWorkdir(content['body']['workdir'] as string));
    dispatchString(builderUpdateStatusText('')); // Idle
    dispatchBool(builderBuildInProgress(false));
  };
  switch (backend as string) {
    case 'rest':
      query['data']['content'] = JSON.stringify(query['data']['content']);
      SubmitQuery({ query, dispatch: dispatchString, callback });
      break;
    case 'electron':
      callback(await builderAPI.BuildAndRun(query));
      break;
    default:
      console.error('Unknown backend: ', backend);
  }
};

interface IBuildAndRunToModule extends IBuildAndRun {
  nodename: string;
}

const BuildAndRunToModule = async ({
  nodename,
  dispatchBool,
  dispatchString,
  snakemake_args,
  snakemake_backend,
  conda_backend,
  environment_variables,
  nodes,
  edges,
}: IBuildAndRunToModule) => {
  dispatchString(builderUpdateStatusText('Building workflow and launching a test run...'));
  dispatchBool(builderBuildInProgress(true));
  const app = BuilderEngine.Instance;
  const query: Query = {
    query: 'builder/build-and-run',
    data: {
      format: 'Snakefile',
      content: app.GetModuleListJSON(nodes, edges),
      targets: [nodename],
      args: snakemake_args,
      backend: snakemake_backend,
      conda_backend: conda_backend,
      environment_variables: environment_variables,
    },
  };
  const callback = (content: Query) => {
    console.log(content);
    if (content['returncode'] !== 0) {
      // Report error
      dispatchString(builderUpdateStatusText('Workflow run FAILED.'));
      dispatchBool(builderBuildInProgress(false));
      return;
    }
    dispatchString(builderUpdateWorkdir(content['body']['workdir'] as string));
    dispatchBool(builderBuildInProgress(false));
    dispatchString(builderUpdateStatusText('')); // Idle
  };
  switch (backend as string) {
    case 'rest':
      query['data']['content'] = JSON.stringify(query['data']['content']);
      SubmitQuery({ query, dispatch: dispatchString, callback });
      break;
    case 'electron':
      callback(await builderAPI.BuildAndRun(query));
      break;
    default:
      console.error('Unknown backend: ', backend);
  }
};

const BuildAndForceRunToModule = async ({
  nodename,
  dispatchBool,
  dispatchString,
  snakemake_args,
  snakemake_backend,
  conda_backend,
  environment_variables,
  nodes,
  edges,
}: IBuildAndRunToModule) => {
  if (snakemake_args.indexOf('--force') === -1) {
    snakemake_args = snakemake_args.concat(' --force');
  }
  BuildAndRunToModule({
    nodename,
    dispatchBool,
    dispatchString,
    snakemake_args,
    snakemake_backend,
    conda_backend,
    environment_variables,
    nodes,
    edges,
  });
};

interface ICleanBuildFolder {
  dispatchBool: TPayloadBool;
  dispatchString: TPayloadString;
}

const CleanBuildFolder = async ({ dispatchBool, dispatchString }: ICleanBuildFolder) => {
  dispatchBool(builderBuildInProgress(true));
  const query: Query = {
    query: 'builder/clean-build-folder',
    data: {
      format: 'Snakefile',
      content: {
        path: '', // Path set in builder package
      },
    },
  };
  const callback = (result) => {
    console.log(result);
    dispatchString(builderUpdateWorkdir(''));
    dispatchBool(builderBuildInProgress(false));
  };
  switch (backend as string) {
    case 'rest':
      query['data']['content'] = JSON.stringify(query['data']['content']);
      SubmitQuery({ query, dispatch: dispatchString, callback });
      break;
    case 'electron':
      callback(await builderAPI.CleanBuildFolder(query));
      break;
    default:
      console.error('Unknown backend: ', backend);
  }
};

interface ICheckNodeDependencies {
  nodename: string;
  nodes: Node[];
  edges: Edge[];
  dispatchString: TPayloadString;
  dispatchNodeList: TPayloadNodeList;
  snakemake_backend: string;
}

const CheckNodeDependencies = async ({
  nodename,
  nodes,
  edges,
  dispatchString,
  dispatchNodeList,
  snakemake_backend,
}: ICheckNodeDependencies) => {
  // Identify all incoming connections to the Target node and build
  //  a JSON Builder object, given it's immediate dependencies
  const app = BuilderEngine.Instance;
  const node = app.getNodeByName(nodename, nodes);
  const inputNodes = app.getNodeInputNodes(node, nodes, edges);
  const depNodeNames = Object.values(inputNodes) as string[];
  depNodeNames.unshift(nodename);
  const jsDeps = app.getModuleListJSONFromNodeNames(depNodeNames, nodes, edges);

  // Submit Build request
  const query: Query = {
    query: 'runner/check-node-dependencies',
    data: {
      format: 'Snakefile',
      content: JSON.stringify(jsDeps),
      backend: snakemake_backend,
    },
  };
  // Set node grey to indicate checking
  const node_type = app.getNodeType(node);
  const all_nodes = app.setNodeColor(node, 'rgb(192,192,192)', nodes);
  dispatchNodeList(builderSetNodes(all_nodes));

  const callback = (data: Query) => {
    dispatchString(builderUpdateStatusText(''));
    switch (data['body']['status']) {
      case 'ok':
        data['returncode'] = 0;
        dispatchNodeList(
          builderSetNodes(
            app.setNodeColor(node, BuilderEngine.GetModuleTypeColor(node_type), nodes),
          ),
        );
        break;
      case 'missing':
        data['returncode'] = 1;
        dispatchNodeList(builderSetNodes(app.setNodeColor(node, 'red', nodes)));
        break;
      default:
        data['returncode'] = -1;
        console.error('Unexpected response: ', data['body']);
    }
    console.log(data);
  };
  switch (backend as string) {
    case 'rest':
      postRequestCheckNodeDependencies({ query, dispatch: dispatchString, callback });
      break;
    case 'electron':
      callback(await runnerAPI.CheckNodeDependencies(query));
      break;
    default:
      console.error('Unknown backend: ', backend);
  }
};

interface INodeSelected {
  node: Node;
  dispatchString: TPayloadString;
}

const NodeSelected = ({ node, dispatchString }: INodeSelected) => {
  const payload = {
    id: node.id,
    name: node.data.config.name,
    type: node.data.config.type,
    nodeparams: JSON.stringify(node.data.config.config, null, 2),
  };
  // Open module parameters pane
  dispatchString(builderUpdateNodeInfo(JSON.stringify(payload)));
};

interface INodeSelectedByID {
  id: string;
  nodes: Node[];
  dispatchString: TPayloadString;
}

const NodeSelectedByID = ({ id, nodes, dispatchString }: INodeSelectedByID) => {
  const node = getNodeById(id, nodes) as Node;
  NodeSelected({ node, dispatchString });
};

interface INodeDeselectedDispatch {
  payload: string;
}
type TNodeDeselectedDispatch = (action: INodeDeselectedDispatch) => void;

const NodeDeselected = (dispatch: TNodeDeselectedDispatch) => {
  dispatch(builderUpdateNodeInfo(''));
};

interface IUpdateNodeInfoKey {
  action: IPayloadRecord;
  dispatch;
  nodeinfo;
  nodes: Node[];
}

const UpdateNodeInfoKey = ({ action, dispatch, nodeinfo, nodes }: IUpdateNodeInfoKey): void => {
  // Update field for node
  console.log('Middleware: UpdateNodeInfoKey');
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
    if (newnodes !== null) {
      dispatch(builderSetNodes(newnodes));
      const newnode = getNodeById(nodeinfo.id, newnodes);
      dispatch(builderNodeSelected(newnode));
    } else {
      console.error('Failed to update node workflow: ', nodeinfo, workflow);
    }
  } else {
    console.log('Node not found: ', nodeinfo);
  }
};

interface IUpdateNodeInfoName {
  action: IPayloadString;
  dispatch;
  nodeinfo;
  nodes: Node[];
}

const UpdateNodeInfoName = ({ action, dispatch, nodeinfo, nodes }: IUpdateNodeInfoName): void => {
  // Update field for node
  console.log('Middleware: UpdateNodeInfoName');
  const builder = BuilderEngine.Instance;
  const node = getNodeById(nodeinfo.id, nodes) as Node;
  if (node !== null) {
    const name = builder.EnsureUniqueName(action.payload, nodes);
    const newnodes = setNodeName(nodes, node.id, name);
    if (newnodes !== null) {
      dispatch(builderSetNodes(newnodes));
      const newnode = getNodeById(nodeinfo.id, newnodes);
      dispatch(builderNodeSelected(newnode));
    } else console.error('Failed to update node name: ', nodeinfo, name);
  } else {
    console.log('Node not found: ', nodeinfo);
  }
};

interface IGetRemoteModules {
  dispatchString: TPayloadString;
  dispatchBool: TPayloadBool;
  repo: string;
}

const GetRemoteModules = async ({ dispatchString, dispatchBool, repo }: IGetRemoteModules) => {
  // Get list of remote modules
  dispatchString(builderUpdateStatusText('Loading modules...'));
  dispatchBool(builderSetModulesLoading(true));
  console.log('Repository settings: ', repo);
  const query: Query = {
    query: 'builder/get-remote-modules',
    data: {
      format: 'Snakefile',
      content: {
        url: repo,
      },
    },
  };
  const callback = (content: Query) => {
    console.log(content);
    if (content['returncode'] !== 0) {
      // Report error
      dispatchBool(builderSetModulesLoading(false));
      dispatchString(builderUpdateStatusText(content['body'] as string));
    } else {
      dispatchString(builderUpdateModulesList(content['body'] as string));
      dispatchBool(builderSetModulesLoading(false));
      dispatchString(builderUpdateStatusText('Modules loaded.'));
    }
  };
  switch (backend as string) {
    case 'rest':
      query['data']['content'] = JSON.stringify(query['data']['content']);
      SubmitQuery({ query, dispatch: dispatchString, callback });
      break;
    case 'electron':
      callback(await builderAPI.GetRemoteModules(query));
      break;
    default:
      console.error('Unknown backend: ', backend);
  }
};

const UpdateModulesList = (dispatch: TPayloadString) => {
  // Update list of modules - done in reducer
  dispatch(builderUpdateStatusText(''));
};

// Write persistent state to electron frontend
const WriteStoreConfig = async (state) => {
  displayAPI.StoreWriteConfig({
    repositories: state.repositories,
    snakemake_backend: state.snakemake_backend,
    snakemake_args: state.snakemake_args,
    conda_backend: state.conda_backend,
    environment_variables: state.environment_variables,
    display_module_settings: state.display_module_settings,
    auto_validate_connections: state.auto_validate_connections,
    package_modules_in_workflow: state.package_modules_in_workflow,
    dark_mode: state.dark_mode,
  });
};

// Read persistent state from electron frontend
const ReadStoreConfig = async (dispatch: TPayloadRecord) => {
  let local_config = {};
  try {
    local_config = await displayAPI.StoreReadConfig();
  } catch (error) {
    // Error reading local config
    return;
  }
  dispatch(builderUpdateSettings(local_config));
};

interface IOpenResultsFolder {
  workdir: string;
}

// Open the current working directory with the native file explorer
const OpenResultsFolder = ({ workdir }: IOpenResultsFolder) => {
  builderAPI.OpenResultsFolder(workdir);
};

///////////////////////////////////////////////////////////////////////////////
// POST request handlers
///////////////////////////////////////////////////////////////////////////////

interface ISubmitQueryExpectZip {
  query: Query;
  callback: (content: unknown) => void;
}

const SubmitQueryExpectZip = async ({ query, callback }: ISubmitQueryExpectZip) => {
  // POST request handler
  const postZIPRequest = async () => {
    const postRequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        responseType: 'blob',
      },
      body: JSON.stringify(query),
    };
    console.info('Sending query: ', query);
    fetch(API_ENDPOINT + '/post', postRequestOptions)
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
          headers: { 'Content-type': 'application/zip' },
        }).text(),
      )
      .then((result) => {
        callback(result);
      });
  };
  postZIPRequest();
};

interface IPostRequestCheckNodeDependencies {
  query: Query;
  dispatch: TPayloadString;
  callback: (data: Query) => void;
}

const postRequestCheckNodeDependencies = ({
  query,
  dispatch,
  callback,
}: IPostRequestCheckNodeDependencies) => {
  const postRequestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(query),
  };
  console.info('Sending query: ', query);
  dispatch(builderUpdateStatusText('Checking node dependencies...'));
  fetch(API_ENDPOINT + '/post', postRequestOptions)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      console.error('Error: ' + response.statusText);
      dispatch(builderUpdateStatusText('Error: ' + response.statusText));
      throw response;
    })
    .then((data) => {
      console.info('Got response: ', data);
      callback(data);
    })
    .catch((error) => {
      console.error('Error during query: ', error);
    });
};

interface ISubmitQuery {
  query: Query;
  dispatch: TPayloadString;
  callback: (content: unknown) => void;
}

const SubmitQuery = async ({ query, dispatch, callback }: ISubmitQuery) => {
  // POST request handler
  const postRequest = async () => {
    const postRequestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      body: JSON.stringify(query),
    };
    console.info('Sending query: ', query);
    fetch(API_ENDPOINT + '/post', postRequestOptions)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        dispatch(builderUpdateStatusText('Error: ' + response.statusText));
        throw response;
      })
      .then((data) => {
        if (data !== null) {
          processResponse(data, callback);
        }
        console.info('Got response: ', data);
      })
      .catch((error) => {
        console.error('Error during query: ', error);
      });
  };

  const processResponse = (content: JSON, callback) => {
    console.log('Process response: ', content);
    dispatch(builderUpdateStatusText(''));
    callback(content);
  };

  // Received query request
  if (JSON.stringify(query) !== JSON.stringify({})) postRequest();
};

interface IUpdateStatusText {
  dispatch: TPayloadString;
  text: string;
}

const UpdateStatusText = ({ dispatch, text }: IUpdateStatusText) => {
  // Send a copy of the status text to the logger
  dispatch(builderLogEvent(text));
};

interface ILoadScene {
  dispatchString: TPayloadString;
  dispatchNodeList: TPayloadNodeList;
  dispatchEdgeList: TPayloadEdgeList;
}

const LoadScene = ({ dispatchString, dispatchNodeList, dispatchEdgeList }: ILoadScene) => {
  const element = document.createElement('input');
  element.setAttribute('type', 'file');
  element.setAttribute('accept', '.json');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  element.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const scene = JSON.parse(e.target.result as string);
      dispatchNodeList(builderSetNodes(scene.nodes));
      dispatchEdgeList(builderSetEdges(scene.edges));
      dispatchString(builderUpdateStatusText('Scene loaded.'));
    };
    reader.readAsText(file);
  };
  document.body.removeChild(element);
};

interface ISaveScene {
  dispatch: TPayloadString;
  nodes: Node[];
  edges: Edge[];
}

const SaveScene = ({ dispatch, nodes, edges }: ISaveScene) => {
  const scene = {
    nodes: nodes,
    edges: edges,
  };
  const filename = 'scene.json';
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(scene, null, 2)),
  );
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  dispatch(builderUpdateStatusText('Scene saved.'));
};
