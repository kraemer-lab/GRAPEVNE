const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("builderAPI", {
  GetRemoteModules: (query: any) =>
    ipcRenderer.invoke("builder/get-remote-modules", query),
  CompileToJson: (query: any) =>
    ipcRenderer.invoke("builder/compile-to-json", query),
  CheckNodeDependencies: (query: any) =>
    ipcRenderer.invoke("builder/check-node-dependencies", query),
});
