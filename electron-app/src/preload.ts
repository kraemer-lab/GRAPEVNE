const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("builderAPI", {
  GetRemoteModules: (query: any) =>
    ipcRenderer.invoke("builder/get-remote-modules", query),
});
