import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as pty from 'node-pty';
import * as os from 'node:os';
import path from 'path';
import * as handles from './handles';

type Event = IpcMainInvokeEvent;
type Query = Record<string, unknown>;

// Create electon window
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
    show: false,
    icon: 'images/icon.png',
  });
  if (app.isPackaged) {
    win.loadFile('index.html'); //prod
    //win.loadURL("http://localhost:5001"); //dev
  } else {
    win.loadURL('http://localhost:5001'); //dev
  }

  // Command line arguments
  const downloadpath = app.commandLine.getSwitchValue('downloadpath');
  if (downloadpath) {
    const ses = win.webContents.session;
    // eslint-disable-next-line no-unused-vars
    ses.on('will-download', (event, item) => {
      // Set the save path, which bypasses the save dialog
      item.setSavePath(path.join(downloadpath, item.getFilename()));
    });
  }
  const fullscreen = app.commandLine.hasSwitch('fullscreen');
  fullscreen ? win.maximize() : win.show();

  return win;
};

app.whenReady().then(() => {
  /////////////////////////
  // Create electron window
  /////////////////////////

  const win = createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ////////////////////////
  // Setup pseudo terminal
  ////////////////////////

  const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 5,
    cwd: process.env.HOME,
    env: process.env,
  });
  const terminal_sendData = (data: string) => {
    ptyProcess.write(data);
  };
  const clearline =
    os.platform() === 'win32'
      ? '\x1b' // ESC (Windows)
      : '\x15'; // CTRL+U (Linux, MacOS)
  const terminal_sendLine = (data: string) => {
    // Clear line before command and add newline at end of command
    terminal_sendData(clearline + data + '\r\n');
  };
  ipcMain.on('terminal/send-data', (event, data: string) => {
    terminal_sendData(data);
  });
  const sendPtyData = (data: string) => {
    win.webContents.send('terminal/receive-data', data.replace(/\r?\n/g, '\r\n'));
  };
  ptyProcess.onData(sendPtyData);

  /////////////////////////////
  // Setup logging to front-end
  /////////////////////////////

  const sendLogData = (data: string) => {
    win.webContents.send('builder/log-event', data.replace(/\r?\n/g, '\r\n'));
  };

  ////////////////////
  // Setup IPC handles
  ////////////////////

  const status_callback = (data: string) => sendLogData(data + '\r\n');
  const stdout_callback = (data: string) => sendLogData(data + '\r\n');
  const stderr_callback = (data: string) => sendLogData(data + '\r\n');

  // Display
  ipcMain.handle('display/folderinfo', (event: Event, data: Query) =>
    handles.display_FolderInfo(event, data, stderr_callback),
  );
  ipcMain.handle('display/select-folder', (event: Event, path: string) =>
    handles.display_SelectFolder(event, path, win),
  );
  ipcMain.handle('display/select-file', (event: Event, path: string) =>
    handles.display_SelectFile(event, path, win),
  );

  // Builder
  ipcMain.handle('builder/get-remote-modules', handles.builder_GetRemoteModules);
  ipcMain.handle('builder/get-remote-module-config', handles.builder_GetRemoteModuleConfig);
  ipcMain.handle('builder/get-module-config-files-list', handles.builder_GetModuleConfigFilesList);
  ipcMain.handle('builder/build-as-module', (event: Event, data: Query) =>
    handles.builder_BuildAsModule(event, data, stderr_callback),
  );
  ipcMain.handle('builder/build-as-workflow', (event: Event, data: Query) =>
    handles.builder_BuildAsWorkflow(event, data, stderr_callback),
  );
  ipcMain.handle('builder/build-and-run', (event: Event, data: Query) =>
    handles.builder_BuildAndRun(event, data, terminal_sendLine, stdout_callback, stderr_callback),
  );
  ipcMain.handle('builder/clean-build-folder', (event: Event, data: Query) =>
    handles.builder_CleanBuildFolder(event, data, status_callback),
  );
  ipcMain.handle('builder/open-results-folder', handles.builder_OpenResultsFolder);
  ipcMain.handle('builder/get-file', (event: Event, filename: string) =>
    handles.builder_GetFile(event, filename),
  );
  ipcMain.handle(
    'builder/get-config-filename-from-snakefile',
    (event: Event, data: Query | string) =>
      handles.builder_GetConfigFilenameFromSnakefile(event, data),
  );
  ipcMain.handle('builder/create-folder', (event: Event, folder: string) =>
    handles.builder_CreateFolder(event, folder),
  );

  // Runner
  ipcMain.handle('runner/build', (event: Event, data: Query) =>
    handles.runner_Build(event, data, stderr_callback),
  );
  ipcMain.handle('runner/deleteresults', (event: Event, data: Query) =>
    handles.runner_DeleteResults(event, data, stderr_callback),
  );
  ipcMain.handle('runner/lint', (event: Event, data: Query) =>
    handles.runner_Lint(event, data, stderr_callback),
  );
  ipcMain.handle('runner/loadworkflow', (event: Event, data: Query) =>
    handles.runner_LoadWorkflow(event, data, stderr_callback),
  );
  ipcMain.handle('runner/tokenize', (event: Event, data: Query) =>
    handles.runner_Tokenize(event, data, stderr_callback),
  );
  ipcMain.handle('runner/tokenize_load', (event: Event, data: Query) =>
    handles.runner_TokenizeLoad(event, data, stderr_callback),
  );
  ipcMain.handle('runner/jobstatus', (event: Event, data: Query) =>
    handles.runner_JobStatus(event, data, stderr_callback),
  );
  ipcMain.handle('runner/launch', (event: Event, data: Query) =>
    handles.runner_Launch(event, data, stderr_callback),
  );
  ipcMain.handle('runner/check-node-dependencies', (event: Event, data: Query) =>
    handles.runner_CheckNodeDependencies(event, data, stderr_callback),
  );

  // NewModule
  ipcMain.handle('newmodule/build', handles.newmodule_Build);
  ipcMain.handle('newmodule/env-conda-search', handles.newmodule_CondaSearch);
  ipcMain.handle('newmodule/open-module-folder', handles.newmodule_OpenModuleFolder);

  // Settings
  ipcMain.handle('settings/store-read-config', (event: Event) =>
    handles.settings_StoreReadConfig(event),
  );
  ipcMain.handle('settings/store-write-config', (event: Event, data: Query) =>
    handles.settings_StoreWriteConfig(event, data),
  );
  ipcMain.handle('settings/github-get-repo-status', (event: Event, query: Query) =>
    handles.settings_GithubGetRepoStatus(event, query, stderr_callback),
  );
  ipcMain.handle('settings/github-get-untracked-files', (event: Event, query: Query) =>
    handles.settings_GithubGetUntrackedFiles(event, query, stderr_callback),
  );
  ipcMain.handle('settings/github-get-tracked-file-changes', (event: Event, query: Query) =>
    handles.settings_GithubGetTrackedFileChanges(event, query, stderr_callback),
  );
  ipcMain.handle('settings/github-pull', (event: Event, query: Query) =>
    handles.settings_GithubPull(event, query, stderr_callback),
  );
  ipcMain.handle('settings/github-push', (event: Event, query: Query) =>
    handles.settings_GithubPush(event, query, stderr_callback),
  );
  ipcMain.handle('settings/github-stage-files', (event: Event, query: Query) =>
    handles.settings_GithubStageFiles(event, query, stderr_callback),
  );
  ipcMain.handle('settings/github-unstage-files', (event: Event, query: Query) =>
    handles.settings_GithubUnstageFiles(event, query, stderr_callback),
  );
  ipcMain.handle('settings/github-commit', (event: Event, query: Query) =>
    handles.settings_GithubCommit(event, query, stderr_callback),
  );
  ipcMain.handle('settings/github-clone', (event: Event, query: Query) =>
    handles.settings_GithubClone(event, query, stderr_callback),
  );
  ipcMain.handle('settings/github-commit-all-changes', (event: Event, query: Query) =>
    handles.settings_GithubCommitAllChanges(event, query, stderr_callback),
  );
});

app.on('will-quit', () => {
  // Clean up
});

app.on('window-all-closed', () => {
  // TODO: Terminal does not respond after first launch on Mac
  //if (process.platform !== "darwin") app.quit();
  app.quit();
});
