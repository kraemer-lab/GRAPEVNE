import { app, BrowserWindow, ipcMain } from "electron";
import handles from "./handles";
import path from "path";
import * as os from "node:os";
import * as pty from "node-pty";

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (app.isPackaged) {
    win.loadFile("index.html"); //prod
  } else {
    win.loadURL("http://localhost:5001"); //dev
    win.webContents.openDevTools();
  }
  return win;
};

app.whenReady().then(() => {
  
  /////////////////////////
  // Create electron window
  /////////////////////////

  const win = createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ////////////////////////
  // Setup pseudo terminal
  ////////////////////////

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 5,
    cwd: process.env.HOME,
    env: process.env
  });
  const terminal_sendData = (data: string) => {
    ptyProcess.write(data);
  }
  ipcMain.on("terminal/send-data", (event, data) => {
    terminal_sendData(data);
  });
  ptyProcess.onData((data: any) => {
    win.webContents.send("terminal/receive-data", data);
  });

  ////////////////////
  // Setup IPC handles
  ////////////////////

  // Display
  ipcMain.handle("display/folderinfo", handles.display_FolderInfo);

  // Builder
  ipcMain.handle(
    "builder/get-remote-modules",
    handles.builder_GetRemoteModules
  );
  ipcMain.handle("builder/compile-to-json", handles.builder_CompileToJson);
  ipcMain.handle(
    "builder/build-and-run",
    (event, data) => handles.builder_BuildAndRun(event, data, terminal_sendData)
  );
  ipcMain.handle(
    "builder/clean-build-folder",
    handles.builder_CleanBuildFolder
  );

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

});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
