const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const {
  GetModulesList,
  CompileToJson,
  CheckNodeDependencies,
} = require("/Users/jsb/repos/jsbrittain/phyloflow/builderjs/dist");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.webContents.openDevTools();

  if (app.isPackaged) {
    win.loadFile("index.html"); //prod
  } else {
    win.loadURL("http://localhost:5001"); //dev
  }
};

async function hBuilderGetRemoteModules(event: any, query: any) {
  const modules = await GetModulesList(query["data"]["content"]["url"]);
  return {
    query: "builder/get-remote-modules",
    body: modules,
  };
}

async function hBuilderCompileToJson(event: any, query: any) {
  return {
    query: "builder/compile-to-json",
    body: {},
  };
}

async function hBuilderCheckNodeDependencies(event: any, query: any) {
  return {
    query: "builder/compile-to-json",
    body: {},
  };
}

app.whenReady().then(() => {
  ipcMain.handle("builder/get-remote-modules", hBuilderGetRemoteModules);
  ipcMain.handle(
    "builder/check-node-dependencies",
    hBuilderCheckNodeDependencies
  );
  ipcMain.handle("builder/compile-to-json", hBuilderCompileToJson);

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
