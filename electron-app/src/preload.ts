const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("displayAPI", {
  FolderInfo: (query: any) => ipcRenderer.invoke("display/folderinfo", query),
});

contextBridge.exposeInMainWorld("builderAPI", {
  CompileToJson: (query: any) =>
    ipcRenderer.invoke("builder/compile-to-json", query),
  GetRemoteModules: (query: any) =>
    ipcRenderer.invoke("builder/get-remote-modules", query),
});

contextBridge.exposeInMainWorld("runnerAPI", {
  Build: (query: any) => ipcRenderer.invoke("runner/build", query),
  DeleteResults: (query: any) =>
    ipcRenderer.invoke("runner/deleteresults", query),
  Lint: (query: any) => ipcRenderer.invoke("runner/lint", query),
  LoadWorkflow: (query: any) =>
    ipcRenderer.invoke("runner/loadworkflow", query),
  Tokenize: (query: any) => ipcRenderer.invoke("runner/tokenize", query),
  TokenizeLoad: (query: any) =>
    ipcRenderer.invoke("runner/tokenize_load", query),
  JobStatus: (query: any) => ipcRenderer.invoke("runner/jobstatus", query),
  Launch: (query: any) => ipcRenderer.invoke("runner/launch", query),
  CheckNodeDependencies: (query: any) =>
    ipcRenderer.invoke("runner/check-node-dependencies", query),
});
