import BuilderEngine from 'gui/Builder/components/BuilderEngine';

import {
  builderBuildInProgress,
  builderGetRemoteModules,
  builderLogEvent,
  builderNodeSelected,
  builderSetEdges,
  builderSetModulesLoading,
  builderSetNodes,
  builderUpdateModulesList,
  builderUpdateNodeInfo,
  builderUpdateStatusText,
  builderUpdateWorkdir,
} from 'redux/actions';
import { IState } from 'redux/reducers';

import { Node } from 'NodeMap/scene/Flow';
import {
  ExportAsPNG,
  ExportAsSVG,
  getNodeById,
  setNodeName,
  setNodeWorkflow,
} from 'gui/Builder/components/Flow';
import { Edge } from 'reactflow';

import { Query } from 'api';
import { IModulesList } from 'redux/reducers/builder';
import { IRepo } from 'redux/reducers/settings';

const builderAPI = window.builderAPI;
const runnerAPI = window.runnerAPI;

export const builderMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      // action.type, action.payload
      if (action.type.split('/')[0] === 'builder') {
        console.log('Middleware [builder]: ', action);
      }
      const state = getState() as IState;
      switch (action.type) {
        case 'builder/build-as-module':
          BuildAs({
            query_name: 'builder/build-as-module',
            builder_api_fcn: builderAPI.BuildAsModule,
            build_path: action.payload || '',
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: state.settings.snakemake_args,
            snakemake_backend: state.settings.snakemake_backend,
            conda_backend: state.settings.conda_backend,
            environment_variables: state.settings.environment_variables,
            package_modules: false,
            nodes: state.builder.nodes,
            edges: state.builder.edges,
            workflow_alerts: {}, // Don't pass alerts for module builds
          });
          break;

        case 'builder/build-as-workflow':
          BuildAs({
            query_name: 'builder/build-as-workflow',
            builder_api_fcn: builderAPI.BuildAsWorkflow,
            build_path: '', // temp location
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: state.settings.snakemake_args,
            snakemake_backend: state.settings.snakemake_backend,
            conda_backend: state.settings.conda_backend,
            environment_variables: state.settings.environment_variables,
            package_modules: false,
            nodes: state.builder.nodes,
            edges: state.builder.edges,
            workflow_alerts: GetWorkflowAlerts(state.settings.workflow_alerts),
          });
          break;

        case 'builder/package-workflow':
          BuildAs({
            query_name: 'builder/build-as-workflow',
            builder_api_fcn: builderAPI.BuildAsWorkflow,
            build_path: '', // temp location
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: state.settings.snakemake_args,
            snakemake_backend: state.settings.snakemake_backend,
            conda_backend: state.settings.conda_backend,
            environment_variables: state.settings.environment_variables,
            package_modules: true,
            nodes: state.builder.nodes,
            edges: state.builder.edges,
            workflow_alerts: GetWorkflowAlerts(state.settings.workflow_alerts),
          });
          break;

        case 'builder/build-and-run':
          BuildAndRun({
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: state.settings.snakemake_args,
            snakemake_backend: state.settings.snakemake_backend,
            conda_backend: state.settings.conda_backend,
            environment_variables: state.settings.environment_variables,
            nodes: state.builder.nodes,
            edges: state.builder.edges,
            workflow_alerts: GetWorkflowAlerts(state.settings.workflow_alerts),
          });
          break;

        case 'builder/build-and-run-to-module':
          BuildAndRunToModule({
            nodename: action.payload,
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: state.settings.snakemake_args,
            snakemake_backend: state.settings.snakemake_backend,
            conda_backend: state.settings.conda_backend,
            environment_variables: state.settings.environment_variables,
            nodes: state.builder.nodes,
            edges: state.builder.edges,
            workflow_alerts: GetWorkflowAlerts(state.settings.workflow_alerts),
          });
          break;

        case 'builder/build-and-force-run-to-module':
          BuildAndForceRunToModule({
            nodename: action.payload,
            dispatchBool: dispatch,
            dispatchString: dispatch,
            snakemake_args: state.settings.snakemake_args,
            snakemake_backend: state.settings.snakemake_backend,
            conda_backend: state.settings.conda_backend,
            environment_variables: state.settings.environment_variables,
            nodes: state.builder.nodes,
            edges: state.builder.edges,
            workflow_alerts: GetWorkflowAlerts(state.settings.workflow_alerts),
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
            nodes: state.builder.nodes,
            edges: state.builder.edges,
            dispatchString: dispatch,
            dispatchNodeList: dispatch,
            snakemake_backend: state.settings.snakemake_backend,
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
            nodes: state.builder.nodes,
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
            nodeinfo: JSON.parse(state.builder.nodeinfo),
            nodes: state.builder.nodes,
          });
          break;

        case 'builder/update-node-info-name':
          UpdateNodeInfoName({
            action: action,
            dispatch: dispatch,
            nodeinfo: JSON.parse(state.builder.nodeinfo),
            nodes: state.builder.nodes,
          });
          break;

        case 'builder/get-remote-modules':
          GetRemoteModules({
            dispatchString: dispatch,
            dispatchBool: dispatch,
            dispatchModulesList: dispatch,
            repo: state.settings.repositories,
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

        case 'builder/open-results-folder':
          OpenResultsFolder({
            workdir: state.builder.workdir,
          });
          break;

        case 'builder/create-folder':
          CreateFolder({
            folder: action.payload,
          });
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
            nodes: state.builder.nodes,
            edges: state.builder.edges,
          });
          break;

        case 'builder/export-as-png':
          ExportAsPNG(state.builder.nodes);
          break;

        case 'builder/export-as-svg':
          ExportAsSVG(state.builder.nodes);
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

interface IPayloadModulesList {
  payload: IModulesList;
  type: string;
}
type TPayloadModulesList = (action: IPayloadModulesList) => void;

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
  build_path: string;
  dispatchBool: TPayloadBool;
  dispatchString: TPayloadString;
  snakemake_args: string;
  snakemake_backend: string;
  conda_backend: string;
  environment_variables: string;
  package_modules: boolean;
  nodes: Node[];
  edges: Edge[];
  workflow_alerts: Query;
}

const BuildAs = async ({
  query_name,
  builder_api_fcn,
  build_path,
  dispatchBool,
  dispatchString,
  snakemake_args,
  snakemake_backend,
  conda_backend,
  environment_variables,
  package_modules,
  nodes,
  edges,
  workflow_alerts,
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
      build_path: build_path,
      args: snakemake_args,
      backend: snakemake_backend,
      conda_backend: conda_backend,
      environment_variables: environment_variables,
      package_modules: package_modules,
      workflow_alerts: workflow_alerts,
    },
  };
  const callback = (result) => {
    // Module can be built in-place, or returned as a zip file
    if (result['zip']) {
      // Download returned content as file
      const filename = 'build.zip';
      const element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:application/zip;base64,' + encodeURIComponent(result['zip']),
      );
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      // Local repository has been updated - refresh module list
      dispatchString(builderGetRemoteModules());
    }
    // Report success (this should be returned by the backend, but that is currently
    // set-up to return the [binary] zip file); console.logs are important for
    // post-build tests
    console.log({ query: query['query'], returncode: 0 });
    // Update status
    dispatchBool(builderBuildInProgress(false));
    dispatchString(builderUpdateStatusText('')); // Idle
  };
  callback(await builder_api_fcn(query));
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
  workflow_alerts: Query;
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
  workflow_alerts,
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
      workflow_alerts: workflow_alerts,
    },
  };
  const callback = (content: Query) => {
    ReportResponse(content);
    if (content['returncode'] !== 0) {
      // Report error
      dispatchString(builderUpdateStatusText('Workflow run FAILED.'));
      dispatchBool(builderBuildInProgress(false));
      return;
    }
    if (content['body']['workdir'] === undefined) {
      console.error('Missing workdir in response: ', content);
      dispatchString(builderUpdateStatusText('Workflow response malformed.'));
      return;
    }
    dispatchString(builderUpdateWorkdir(content['body']['workdir'] as string));
    dispatchString(builderUpdateStatusText('')); // Idle
    dispatchBool(builderBuildInProgress(false));
  };
  callback(await builderAPI.BuildAndRun(query));
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
  workflow_alerts,
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
      workflow_alerts: workflow_alerts,
    },
  };
  const callback = (content: Query) => {
    ReportResponse(content);
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
  callback(await builderAPI.BuildAndRun(query));
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
  workflow_alerts,
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
    workflow_alerts,
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
  callback(await builderAPI.CleanBuildFolder(query));
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
    // Report query response for testing script
    console.log(data);
  };
  callback(await runnerAPI.CheckNodeDependencies(query));
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
  dispatchModulesList: TPayloadModulesList;
  repo: IRepo[];
}

const GetRemoteModules = async ({
  dispatchString,
  dispatchBool,
  dispatchModulesList,
  repo,
}: IGetRemoteModules) => {
  // Backend check
  if (builderAPI === undefined) {
    console.error('builderAPI is undefined');
    return;
  }
  // Get list of remote modules
  dispatchString(builderUpdateStatusText('Loading modules...'));
  dispatchBool(builderSetModulesLoading(true));
  dispatchModulesList(builderUpdateModulesList([]));
  const query: Query = {
    query: 'builder/get-remote-modules',
    data: {
      format: 'Snakefile',
      content: {
        url: repo.filter((repo) => repo.active),
      },
    },
  };
  const callback = (content: Query) => {
    ReportResponse(content);
    if (content['returncode'] !== 0) {
      // Report error
      dispatchBool(builderSetModulesLoading(false));
      dispatchString(builderUpdateStatusText(content['body'] as string));
    } else {
      const modules_list = content['body'] as IModulesList;
      dispatchModulesList(builderUpdateModulesList(modules_list));
      dispatchBool(builderSetModulesLoading(false));
      dispatchString(builderUpdateStatusText('Modules loaded.'));
    }
  };
  callback(await builderAPI.GetRemoteModules(query));
};

const UpdateModulesList = (dispatch: TPayloadString) => {
  // Update list of modules - done in reducer
  dispatch(builderUpdateStatusText(''));
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

const ReportResponse = (content: Query) => {
  // Responses are output to the console for debugging
  // These are used in end-to-end tests to interrogate the state of actions
  console.log(content);
};

interface IUpdateStatusText {
  dispatch: TPayloadString;
  text: string;
}

const UpdateStatusText = ({ dispatch, text }: IUpdateStatusText) => {
  // Send a copy of the status text to the logger
  dispatch(builderLogEvent(text));
};

const CreateFolder = ({ folder }: { folder: string }) => {
  builderAPI.CreateFolder(folder);
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

const GetWorkflowAlerts = (alerts: IState['settings']['workflow_alerts']) => {
  if (
    alerts['email_settings'] === undefined ||
    alerts['email_settings']['smtp_server'] === '' ||
    alerts['email_settings']['smtp_port'] === undefined
  ) {
    // Email settings are not set
    console.log('Email settings are not set.');
    console.log(alerts);
    console.log(alerts['email_settings']);
    return {};
  }
  const onsuccess_enabled = alerts['onsuccess'] !== undefined && alerts['onsuccess']['enabled'];
  const onerror_enabled = alerts['onerror'] !== undefined && alerts['onerror']['enabled'];
  if (!onsuccess_enabled && !onerror_enabled) {
    // Neither alerts are enabled
    console.log('Neither alerts are enabled.');
    return {};
  }
  const out_alerts = {};
  out_alerts['email_settings'] = alerts.email_settings;
  if (onsuccess_enabled) {
    console.log('email onsuccess_enabled: ', alerts.onsuccess);
    out_alerts['onsuccess'] = alerts.onsuccess;
  }
  if (onerror_enabled) {
    console.log('email onerror_enabled: ', alerts.onerror);
    out_alerts['onerror'] = alerts.onerror;
  }
  return out_alerts;
};
