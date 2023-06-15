const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("builderAPI", {
  GetRemoteModules: (query) =>
    ipcRenderer.invoke("builder/get-remote-modules", query),
});
