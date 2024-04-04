export interface INewModuleStateConfigInputFilesRow {
  id: number;
  port: string;
  label: string;
  filename: string;
}

export interface INewModuleStateConfigOutputFilesRow {
  id: number;
  label: string;
  filename: string;
}

export interface INewModuleStateConfigFile {
  id: string;
  label: string;
  filename: string;
  isfolder: boolean;
}

export interface INewModuleBuildSettings {
  overwrite_existing_module_folder: boolean;
  as_zip: boolean;
}

export interface INewModuleStateConfig {
  name: string;
  foldername: string;
  repo: string;
  project: string;
  docstring: string;
  ports: string[];
  params: string;
  input_files: INewModuleStateConfigInputFilesRow[];
  output_files: INewModuleStateConfigOutputFilesRow[];
  env: string;
  scripts: INewModuleStateConfigFile[];
  resources: INewModuleStateConfigFile[];
  command_directive: string;
  command: string;
}

export interface INewModuleStateEnvCondaSearch {
  [key: string]: string;
}

export interface INewModuleStateEnv {
  condasearch: INewModuleStateEnvCondaSearch;
  packagelist: string[][];
}

export interface INewModuleState {
  config: INewModuleStateConfig;
  env: INewModuleStateEnv;
  build: INewModuleBuildSettings;
}
