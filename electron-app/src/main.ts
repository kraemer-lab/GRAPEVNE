const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const builderjs = require("/Users/jsb/repos/jsbrittain/phyloflow/builderjs");

async function builderhGetRemoteModules(event: any, query: any) {
  const modules = await builderjs.GetModulesList(
    query["data"]["content"]["url"]
  );
  return {
    query: "builder/get-remote-modules",
    body: modules,
  };
}

async function builderhCompileToJson(event: any, query: any) {
  //const js = BuildFromJSON(query["data"]["content"])
  // TODO: Response should be binary64 encoded zip-file (can this be serialised?)
  return {
    query: "builder/compile-to-json",
    body: {},
  };
}

async function runnerhCheckNodeDependencies(event: any, query: any) {
  return {
    query: "runner/check-node-dependencies",
    body: {},
  };
}

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

app.whenReady().then(() => {
  // Builder
  ipcMain.handle("builder/get-remote-modules", builderhGetRemoteModules);
  ipcMain.handle("builder/compile-to-json", builderhCompileToJson);

  // Runner
  ipcMain.handle(
    "builder/check-node-dependencies",
    runnerhCheckNodeDependencies
  );

  // Create electron window
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
