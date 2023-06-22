const builderjs = require("builderjs");
const { PythonShell } = require("python-shell");

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

exports.display_FolderInfo = display_FolderInfo;
exports.builder_GetRemoteModules = builder_GetRemoteModules;
exports.builder_CompileToJson = builder_CompileToJson;
exports.runner_Build = runner_Build;
exports.runner_DeleteResults = runner_DeleteResults;
exports.runner_Lint = runner_Lint;
exports.runner_LoadWorkflow = runner_LoadWorkflow;
exports.runner_Tokenize = runner_Tokenize;
exports.runner_TokenizeLoad = runner_TokenizeLoad;
exports.runner_JobStatus = runner_JobStatus;
exports.runner_Launch = runner_Launch;
exports.runner_CheckNodeDependencies = runner_CheckNodeDependencies;
