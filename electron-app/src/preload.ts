import { ipcRenderer } from "electron";
import { contextBridge } from "electron";
import { TerminalAPI } from "./api";
import { DisplayAPI } from "./api";
import { BuilderAPI } from "./api";
import { RunnerAPI } from "./api";

type Event = Electron.IpcRendererEvent;
type Query = Record<string, unknown>;

contextBridge.exposeInMainWorld("terminalAPI", {
  sendData: (data: string) => ipcRenderer.send("terminal/send-data", data),
  receiveData: (callback: (event: Event, data: Query) => void) =>
    ipcRenderer.on("terminal/receive-data", callback),
});

contextBridge.exposeInMainWorld("displayAPI", {
  FolderInfo: (query: Query) => ipcRenderer.invoke("display/folderinfo", query),
});

contextBridge.exposeInMainWorld("builderAPI", {
  CompileToJson: (query: Query) =>
    ipcRenderer.invoke("builder/compile-to-json", query),
  BuildAndRun: (query: Query) =>
    ipcRenderer.invoke("builder/build-and-run", query),
  CleanBuildFolder: (query: Query) =>
    ipcRenderer.invoke("builder/clean-build-folder", query),
  GetRemoteModules: (query: Query) =>
    ipcRenderer.invoke("builder/get-remote-modules", query),
  GetRemoteModuleConfig: (query: Query) =>
    ipcRenderer.invoke("builder/get-remote-module-config", query),
  logEvent: (callback: (event: Event, data: string) => void) =>
    ipcRenderer.on("builder/log-event", callback),
});

contextBridge.exposeInMainWorld("runnerAPI", {
  Build: (query: Query) => ipcRenderer.invoke("runner/build", query),
  DeleteResults: (query: Query) =>
    ipcRenderer.invoke("runner/deleteresults", query),
  Lint: (query: Query) => ipcRenderer.invoke("runner/lint", query),
  LoadWorkflow: (query: Query) =>
    ipcRenderer.invoke("runner/loadworkflow", query),
  Tokenize: (query: Query) => ipcRenderer.invoke("runner/tokenize", query),
  TokenizeLoad: (query: Query) =>
    ipcRenderer.invoke("runner/tokenize_load", query),
  JobStatus: (query: Query) => ipcRenderer.invoke("runner/jobstatus", query),
  Launch: (query: Query) => ipcRenderer.invoke("runner/launch", query),
  CheckNodeDependencies: (query: Query) =>
    ipcRenderer.invoke("runner/check-node-dependencies", query),
});

declare global {
  interface Window {
    terminalAPI: TerminalAPI;
    displayAPI: DisplayAPI;
    builderAPI: BuilderAPI;
    runnerAPI: RunnerAPI;
  }
}
