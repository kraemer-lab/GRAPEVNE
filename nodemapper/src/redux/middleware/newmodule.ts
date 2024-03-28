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
          Build(getState().newmodule.config);
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

const Build = async (moduleConfig) => {
  const callback = (content: Query) => {
    console.log(content);
  };
  // Pass config to backend for construction //
  callback(await newmoduleAPI.Build(moduleConfig));
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
