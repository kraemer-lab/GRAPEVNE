import { settingsUpdateSettings } from 'redux/actions';
import { IState } from 'redux/reducers';

const settingsAPI = window.settingsAPI;

export const settingsMiddleware = ({ getState, dispatch }) => {
  return (next) => {
    return (action) => {
      // action.type, action.payload
      if (action.type.split('/')[0] === 'settings') {
        console.log('Middleware [settings]: ', action);
      }
      const state = getState() as IState;
      switch (action.type) {
        case 'settings/read-store-config':
          ReadStoreConfig(dispatch);
          break;
        case 'settings/write-store-config':
          WriteStoreConfig(state.settings);
          break;
        default:
          break;
      }
      return next(action);
    };
  };
};

type Query = Record<string, unknown>;

interface IPayloadRecord {
  payload: Query;
  type: string;
}
type TPayloadRecord = (action: IPayloadRecord) => void;

const WriteStoreConfig = async (state) => {
  if (settingsAPI === undefined) return;
  settingsAPI.StoreWriteConfig({
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
  if (settingsAPI === undefined) return;
  let local_config = {};
  try {
    local_config = await settingsAPI.StoreReadConfig();
  } catch (error) {
    console.log('Error reading local config: ', error);
    return;
  }
  dispatch(settingsUpdateSettings(local_config));
};
