import { contextBridge, ipcRenderer } from 'electron';
import { BuilderAPI, DisplayAPI, RunnerAPI, TerminalAPI } from './api';

type Event = Electron.IpcRendererEvent;
type Query = Record<string, unknown>;

contextBridge.exposeInMainWorld('terminalAPI', {
  sendData: (data: string) => ipcRenderer.send('terminal/send-data', data),
  receiveData: (callback: (event: Event, data: string) => void) => {
    ipcRenderer.removeAllListeners('terminal/receive-data');
    ipcRenderer.on('terminal/receive-data', callback);
  },
});

contextBridge.exposeInMainWorld('displayAPI', {
  FolderInfo: (query: Query) => ipcRenderer.invoke('display/folderinfo', query),
  SelectFolder: (path: string) => ipcRenderer.invoke('display/select-folder', path),
  SelectFile: (path: string) => ipcRenderer.invoke('display/select-file', path),
});

contextBridge.exposeInMainWorld('builderAPI', {
  BuildAsModule: (query: Query) => ipcRenderer.invoke('builder/build-as-module', query),
  BuildAsWorkflow: (query: Query) => ipcRenderer.invoke('builder/build-as-workflow', query),
  BuildAndRun: (query: Query) => ipcRenderer.invoke('builder/build-and-run', query),
  CleanBuildFolder: (query: Query) => ipcRenderer.invoke('builder/clean-build-folder', query),
  GetRemoteModules: (query: Query) => ipcRenderer.invoke('builder/get-remote-modules', query),
  GetRemoteModuleConfig: (query: Query) =>
    ipcRenderer.invoke('builder/get-remote-module-config', query),
  GetModuleConfigFilesList: (query: Query | string) =>
    ipcRenderer.invoke('builder/get-module-config-files-list', query),
  OpenResultsFolder: (workdir: string) =>
    ipcRenderer.invoke('builder/open-results-folder', workdir),
  logEvent: (callback: (event: Event, data: string) => void) => {
    ipcRenderer.removeAllListeners('builder/log-event');
    ipcRenderer.on('builder/log-event', callback);
  },
  GetFile: (filename: string) => ipcRenderer.invoke('builder/get-file', filename),
  GetConfigFilenameFromSnakefile: (filename: Query | string) =>
    ipcRenderer.invoke('builder/get-config-filename-from-snakefile', filename),
});

contextBridge.exposeInMainWorld('runnerAPI', {
  Build: (query: Query) => ipcRenderer.invoke('runner/build', query),
  DeleteResults: (query: Query) => ipcRenderer.invoke('runner/deleteresults', query),
  Lint: (query: Query) => ipcRenderer.invoke('runner/lint', query),
  LoadWorkflow: (query: Query) => ipcRenderer.invoke('runner/loadworkflow', query),
  Tokenize: (query: Query) => ipcRenderer.invoke('runner/tokenize', query),
  TokenizeLoad: (query: Query) => ipcRenderer.invoke('runner/tokenize_load', query),
  JobStatus: (query: Query) => ipcRenderer.invoke('runner/jobstatus', query),
  Launch: (query: Query) => ipcRenderer.invoke('runner/launch', query),
  CheckNodeDependencies: (query: Query) =>
    ipcRenderer.invoke('runner/check-node-dependencies', query),
});

contextBridge.exposeInMainWorld('newmoduleAPI', {
  Build: (query: Query) => ipcRenderer.invoke('newmodule/build', query),
  CondaSearch: (query: Query) => ipcRenderer.invoke('newmodule/env-conda-search', query),
  OpenModuleFolder: (folder: string) => ipcRenderer.invoke('newmodule/open-module-folder', folder),
});

contextBridge.exposeInMainWorld('settingsAPI', {
  StoreReadConfig: () => ipcRenderer.invoke('settings/store-read-config'),
  StoreWriteConfig: (query: Query) => ipcRenderer.invoke('settings/store-write-config', query),
});

declare global {
  interface Window {
    terminalAPI: TerminalAPI;
    displayAPI: DisplayAPI;
    builderAPI: BuilderAPI;
    runnerAPI: RunnerAPI;
  }
}
