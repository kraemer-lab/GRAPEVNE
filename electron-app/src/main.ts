import { app, BrowserWindow, ipcMain } from "electron";
import handles from "./handles";
import path from "path";

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
  // Display
  ipcMain.handle("display/folderinfo", handles.display_FolderInfo);

  // Builder
  ipcMain.handle(
    "builder/get-remote-modules",
    handles.builder_GetRemoteModules
  );
  ipcMain.handle("builder/compile-to-json", handles.builder_CompileToJson);
  ipcMain.handle("builder/build-and-run", handles.builder_BuildAndRun);

  // Runner
  ipcMain.handle("runner/build", handles.runner_Build);
  ipcMain.handle("runner/deleteresults", handles.runner_DeleteResults);
  ipcMain.handle("runner/lint", handles.runner_Lint);
  ipcMain.handle("runner/loadworkflow", handles.runner_LoadWorkflow);
  ipcMain.handle("runner/tokenize", handles.runner_Tokenize);
  ipcMain.handle("runner/tokenize_load", handles.runner_TokenizeLoad);
  ipcMain.handle("runner/jobstatus", handles.runner_JobStatus);
  ipcMain.handle("runner/launch", handles.runner_Launch);
  ipcMain.handle(
    "runner/check-node-dependencies",
    handles.runner_CheckNodeDependencies
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
