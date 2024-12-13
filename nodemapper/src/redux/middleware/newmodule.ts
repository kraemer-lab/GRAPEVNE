import { Query } from 'api';
import { newmoduleEnvCondaSearchUpdatePackageList, newmoduleUpdateResult } from 'redux/actions';
import { IState } from 'redux/reducers';

const newmoduleAPI = window.newmoduleAPI;

export const newmoduleMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      // action.type, action.payload
      if (action.type.split('/')[0] === 'builder') {
        console.log('Middleware [builder]: ', action);
      }
      const state = getState() as IState;
      switch (action.type) {
        case 'newmodule/update-config':
          break;

        case 'newmodule/build':
          Build(state.newmodule, dispatch);
          break;

        case 'newmodule/validate':
          Validate(state.newmodule.config);
          break;

        case 'newmodule/open-module-folder':
          OpenModuleFolder(state.newmodule.result.folder);
          break;

        case 'newmodule/env-conda-search':
          EnvCondaSearch(action.payload, dispatch);
          break;

        default:
          break;
      }

      return next(action);
    };
  };
};

// -------------------------------------------------------------------------------------

const ReportStatus = (status) => {
  console.log(status);
};

const Build = async (moduleState, dispatch) => {
  const callback = (response) => {
    if (response['body']['zip'] !== null) {
      // Download zip file
      const blob = new Blob([response['body']['zip']], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = moduleState.config.foldername + '.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (response['body']['folder']) {
      // Update module state with new module
      const newmoduleResult = { ...moduleState.result };
      newmoduleResult.folder = response['body']['folder'];
      dispatch(newmoduleUpdateResult(newmoduleResult));
    }
  };

  // Pass config to backend for construction
  dispatch(newmoduleUpdateResult({ building: true }));
  let response = await newmoduleAPI.Build(moduleState);
  if (response['returncode'] === 0) {
    // Update module state with new module
    callback(response);
  } else if (response['returncode'] === 1) {
    // Error
    const msg = response['body']['msg'];
    if (msg.startsWith('ERROR') && msg.includes('Module folder already exists')) {
      if (window.confirm('Module folder already exists. Overwrite?')) {
        // Overwrite - resubmit build request with overwrite flag
        const newModuleState = JSON.parse(JSON.stringify(moduleState)); // deep copy
        newModuleState.build.overwrite_existing_module_folder = true;
        response = await newmoduleAPI.Build(newModuleState);
        callback(response);
      }
    } else {
      alert(`Building failed with message:\n${msg}"`);
    }
  }
  dispatch(newmoduleUpdateResult({ building: false }));
  ReportStatus(response);
};

const Validate = (moduleConfig) => {
  console.log(moduleConfig);
};

const OpenModuleFolder = (folder: string) => {
  newmoduleAPI.OpenModuleFolder(folder);
};

const EnvCondaSearch = async (config, dispatch) => {
  const callback = (content: Query) => {
    if (!Array.isArray(content['data'])) {
      console.debug('No data returned from conda search');
      dispatch(newmoduleEnvCondaSearchUpdatePackageList([]));
      return;
    }
    const data = content['data'] as string[][];
    dispatch(newmoduleEnvCondaSearchUpdatePackageList(data));
  };
  // Pass conda search config to backend for execution with conda
  callback(await newmoduleAPI.CondaSearch(config));
};
