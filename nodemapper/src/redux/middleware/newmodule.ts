import * as globals from 'redux/globals';

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

        default:
          break;
      }

      return next(action);
    };
  };
};

// -------------------------------------------------------------------------------------

const Build = async (moduleConfig) => {
  console.log(moduleConfig);
  
  const callback = (content: Query) => {
    console.log(content);
  }
  
  // Pass config to backend for construction //
  callback(await newmoduleAPI.Build(moduleConfig));

};

const Validate = (moduleConfig) => {
  console.log(moduleConfig);
};
