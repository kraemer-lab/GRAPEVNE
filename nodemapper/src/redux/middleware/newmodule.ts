import { newmoduleEnvCondaSearchUpdatePackageList } from 'redux/actions';

type Query = Record<string, unknown>;
const newmoduleAPI = window.newmoduleAPI;

export const newmoduleMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      // action.type, action.payload
      if (action.type.split('/')[0] === 'builder') {
        console.log('Middleware [builder]: ', action);
      }
      switch (action.type) {
        case 'newmodule/update-config':
          break;

        case 'newmodule/build':
          Build(getState().newmodule);
          break;

        case 'newmodule/validate':
          Validate(getState().newmodule.config);
          break;

        case 'newmodule/open-module-folder':
          console.log('Open module folder');
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
}

const Build = async (moduleState) => {
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
    }
  };

  // Pass config to backend for construction
  let response = await newmoduleAPI.Build(moduleState);
  if (response['returncode'] === 0) {
    // Update module state with new module
    callback(response);
  } else if (response['returncode'] === 1) {
    // Error
    const msg = response['body']['msg'];
    if (msg.startsWith('ERROR') && msg.includes('Module folder already exists')) {
      if (window.confirm("Module folder already exists. Overwrite?")) {
        // Overwrite - resubmit build request with overwrite flag
        const newModuleState = JSON.parse(JSON.stringify(moduleState));  // deep copy
        newModuleState.build.overwrite_existing_module_folder = true;
        response = await newmoduleAPI.Build(newModuleState);
        callback(response);
      }
    }
  }
  ReportStatus(response);
};

const Validate = (moduleConfig) => {
  console.log(moduleConfig);
};

const EnvCondaSearch = async (config, dispatch) => {
  const callback = (content: Query) => {
    const data = content['data'] as string[][];
    dispatch(newmoduleEnvCondaSearchUpdatePackageList(data));
  };
  // Pass conda search config to backend for execution with conda
  callback(await newmoduleAPI.CondaSearch(config));
};
