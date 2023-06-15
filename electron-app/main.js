const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const {
  GetModulesList,
} = require("/Users/jsb/repos/jsbrittain/phyloflow/builderjs");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.webContents.openDevTools();

  ipcMain.on("set-title", (event, title) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    // Ignore provided title and instead retrieve from external module as a test
    title = getMsg();
    win.setTitle(title);
  });

  if (app.isPackaged) {
    win.loadFile("index.html"); //prod
  } else {
    win.loadURL("http://localhost:5001"); //dev
  }
};

const handleGetRemoteModules = async (event, query) => {
  console.log(query["data"]["content"]["url"]);
  modules = GetModulesList(query["data"]["content"]["url"]);
  console.log(modules);
  return {
    query: "builder/get-remote-modules",
    body: GetModulesList(query["data"]["content"]["url"]),
  };
};

app.whenReady().then(() => {
  ipcMain.handle("builder/get-remote-modules", handleGetRemoteModules);

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
