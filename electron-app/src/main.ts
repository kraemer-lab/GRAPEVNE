import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import * as handles from "./handles";
import * as os from "node:os";
import * as pty from "node-pty";
import Store from "electron-store";

// Set up electron-store (persistent local configuration)
const store = new Store();

// Create electon window
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
  }

  // Command line arguments
  const downloadpath = app.commandLine.getSwitchValue("downloadpath");
  if (downloadpath) {
    const ses = win.webContents.session;
    // eslint-disable-next-line no-unused-vars
    ses.on("will-download", (event, item) => {
      // Set the save path, which bypasses the save dialog
      item.setSavePath(path.join(downloadpath, item.getFilename()));
    });
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

  const shell =
    os.platform() === "win32" ? "powershell.exe" : process.env.SHELL || "bash";
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 5,
    cwd: process.env.HOME,
    env: process.env,
  });
  const terminal_sendData = (data: string) => {
    ptyProcess.write(data);
  };
  const clearline =
    os.platform() === "win32"
      ? "\x1b" // ESC (Windows)
      : "\x15"; // CTRL+U (Linux, MacOS)
  const terminal_sendLine = (data: string) => {
    // Clear line before command and add newline at end of command
    terminal_sendData(clearline + data + "\r\n");
  };
  ipcMain.on("terminal/send-data", (event, data: string) => {
    terminal_sendData(data);
  });
  const sendPtyData = (data: string) => {
    win.webContents.send(
      "terminal/receive-data",
      data.replace(/\r?\n/g, "\r\n"),
    );
  };
  ptyProcess.onData(sendPtyData);

  /////////////////////////////
  // Setup logging to front-end
  /////////////////////////////

  const sendLogData = (data: string) => {
    win.webContents.send("builder/log-event", data.replace(/\r?\n/g, "\r\n"));
  };

  ////////////////////
  // Setup IPC handles
  ////////////////////

  // Display
  ipcMain.handle("display/folderinfo", handles.display_FolderInfo);
  ipcMain.handle("display/store-read-config", (event) =>
    handles.display_StoreReadConfig(event, store),
  );
  ipcMain.handle("display/store-write-config", (event, data) =>
    handles.display_StoreWriteConfig(event, store, data),
  );

  // Builder
  ipcMain.handle(
    "builder/get-remote-modules",
    handles.builder_GetRemoteModules,
  );
  ipcMain.handle(
    "builder/get-remote-module-config",
    handles.builder_GetRemoteModuleConfig,
  );
  ipcMain.handle("builder/build-as-module", handles.builder_BuildAsModule);
  ipcMain.handle("builder/build-as-workflow", handles.builder_BuildAsWorkflow);
  ipcMain.handle("builder/build-and-run", (event, data) =>
    handles.builder_BuildAndRun(
      event,
      data,
      terminal_sendLine,
      (data: string) => sendLogData(data + "\r\n"), // stdout_callback
      (data: string) => sendLogData(data + "\r\n"), // stderr_callback
    ),
  );
  ipcMain.handle("builder/clean-build-folder", (event, data) =>
    handles.builder_CleanBuildFolder(event, data, (data: string) =>
      sendLogData(data + "\r\n"),
    ),
  );
  ipcMain.handle("builder/open-results-folder", handles.builder_OpenResultsFolder);

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
    handles.runner_CheckNodeDependencies,
  );
});

app.on("will-quit", () => {
  // Clean up
});

app.on("window-all-closed", () => {
  // TODO: Terminal does not respond after first launch on Mac
  //if (process.platform !== "darwin") app.quit();
  app.quit();
});
