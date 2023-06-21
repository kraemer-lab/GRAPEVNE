const { app, BrowserWindow, ipcMain } = require("electron");
const { PythonShell } = require("python-shell");
const path = require("path");

const builderjs = require("builderjs");

const use_nodejs = false;

// General query processing interface for Python scripts (replacement for Flask)
async function ProcessQuery(
  event: any,
  query: any
): Promise<Record<string, any>> {
  let options = {
    mode: "json",
    pythonPath: "python",
    pythonOptions: ["-u"], // get print results in real-time
    scriptPath: "./src/python",
    args: [JSON.stringify(query)],
  };
  return await PythonShell.run("backend.py", options).then(function (
    results: any
  ) {
    return results.pop();
  });
}

// Query handlers (migrating from python-shell to nodejs)

async function display_FolderInfo(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

async function builder_GetRemoteModules(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    const modules = await builderjs.GetModulesList(
      query["data"]["content"]["url"]
    );
    return {
      query: "builder/get-remote-modules",
      body: modules,
    };
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}
async function builder_CompileToJson(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*const js = BuildFromJSON(query["data"]["content"])
    return {
      query: "builder/compile-to-json",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

async function runner_Build(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}
async function runner_DeleteResults(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}
async function runner_Lint(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}
async function runner_LoadWorkflow(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}
async function runner_Tokenize(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}
async function runner_TokenizeLoad(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}
async function runner_JobStatus(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}
async function runner_Launch(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}
async function runner_CheckNodeDependencies(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
    /*return {
      query: "runner/check-node-dependencies",
      body: {},
    };*/
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

// *****************************************************************************

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
  ipcMain.handle("display/folderinfo", display_FolderInfo);

  // Builder
  ipcMain.handle("builder/get-remote-modules", builder_GetRemoteModules);
  ipcMain.handle("builder/compile-to-json", builder_CompileToJson);

  // Runner
  ipcMain.handle("runner/build", runner_Build);
  ipcMain.handle("runner/deleteresults", runner_DeleteResults);
  ipcMain.handle("runner/lint", runner_Lint);
  ipcMain.handle("runner/loadworkflow", runner_LoadWorkflow);
  ipcMain.handle("runner/tokenize", runner_Tokenize);
  ipcMain.handle("runner/tokenize_load", runner_TokenizeLoad);
  ipcMain.handle("runner/jobstatus", runner_JobStatus);
  ipcMain.handle("runner/launch", runner_Launch);
  ipcMain.handle(
    "runner/check-node-dependencies",
    runner_CheckNodeDependencies
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
