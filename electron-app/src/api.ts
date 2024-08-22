type Event = unknown;
type Query = Record<string, unknown>;

export type TerminalAPI = {
  sendData: (data: string) => void;
  receiveData: (callback: (event: Event, data: string) => void) => void;
};

export type DisplayAPI = {
  FolderInfo: (query: Query) => Promise<Query>;
  SelectFolder: (path: string) => Promise<string[]>;
  SelectFile: (path: string) => Promise<string[]>;
};

export type BuilderAPI = {
  BuildAsModule: (query: Query) => Promise<Query>;
  BuildAsWorkflow: (query: Query) => Promise<Query>;
  BuildAndRun: (query: Query) => Promise<Query>;
  CleanBuildFolder: (query: Query) => Promise<Query>;
  GetRemoteModules: (query: Query) => Promise<Query>;
  GetRemoteModuleConfig: (query: Query) => Promise<Query>;
  GetModuleConfigFilesList: (query: Query | string) => Promise<string[]>;
  OpenResultsFolder: (workdir: string) => Promise<Query>;
  logEvent: (callback: (event: Event, data: string) => void) => void;
  GetFile: (filename: string) => Promise<string>;
  GetConfigFilenameFromSnakefile: (filename: Query | string) => Promise<string>;
  CreateFolder: (folder: string) => Promise<Query>;
};

export type RunnerAPI = {
  Build: (query: Query) => Promise<Query>;
  DeleteResults: (query: Query) => Promise<Query>;
  Lint: (query: Query) => Promise<Query>;
  LoadWorkflow: (query: Query) => Promise<Query>;
  Tokenize: (query: Query) => Promise<Query>;
  TokenizeLoad: (query: Query) => Promise<Query>;
  JobStatus: (query: Query) => Promise<Query>;
  Launch: (query: Query) => Promise<Query>;
  CheckNodeDependencies: (query: Query) => Promise<Query>;
};

export type NewModuleAPI = {
  Build: (query: Query) => Promise<Query>;
  CondaSearch: (query: Query) => Promise<Query>;
  OpenModuleFolder: (folder: string) => Promise<Query>;
};

export type SettingsAPI = {
  StoreReadConfig: () => Promise<Query>;
  StoreWriteConfig: (query: Query) => Promise<Query>;
};

declare global {
  interface Window {
    terminalAPI: TerminalAPI;
    displayAPI: DisplayAPI;
    builderAPI: BuilderAPI;
    runnerAPI: RunnerAPI;
    newmoduleAPI: NewModuleAPI;
    settingsAPI: SettingsAPI;
  }
}
