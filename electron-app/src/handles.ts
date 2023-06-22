import builderjs from "builderjs";
import fs from "fs";
import { PythonShell, Options } from "python-shell";

const use_nodejs = false;

// General query processing interface for Python scripts (replacement for Flask)
export async function ProcessQuery(
  event: any,
  query: Record<string, unknown>,
  mode = "json" // json, text, binary
): Promise<Record<string, any>> {
  const options = {
    mode: mode,
    pythonPath: "python",
    pythonOptions: ["-u"], // get print results in real-time
    scriptPath: "./src/python",
    args: [JSON.stringify(query)],
  } as Options;
  return await PythonShell.run("backend.py", options).then(function (
    results: any
  ) {
    console.log("results: %j", results);
    return results.pop();
  });
}

// Query handlers (migrating from python-shell to nodejs)

export async function display_FolderInfo(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

export async function builder_GetRemoteModules(event: any, query: any) {
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

export async function builder_CompileToJson(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    // Note: Instead of returning the zip file as a base64 string from Python
    //       (as was the procedure in the REST implementation), we instead rely
    //       on Python saving the zip file to disk, then reading it back in.

    // ensure any previous zip file is deleted before sending query
    await fs.unlink("./build.zip", (err: unknown) => {
      console.warn(err);
    });
    await ProcessQuery(event, query, "text");
    return fs.readFileSync("./build.zip", { encoding: "base64" });
  }
}

export async function runner_Build(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

export async function runner_DeleteResults(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

export async function runner_Lint(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

export async function runner_LoadWorkflow(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

export async function runner_Tokenize(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

export async function runner_TokenizeLoad(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

export async function runner_JobStatus(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

export async function runner_Launch(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
  } else {
    // python version
    return await ProcessQuery(event, query);
  }
}

export async function runner_CheckNodeDependencies(event: any, query: any) {
  if (use_nodejs) {
    // nodejs version
    throw new Error("Not yet implemented");
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
export default exports;
