import fs from "fs";
import path from "path";
import * as child from "child_process";

const pythonPath = path.join(process.resourcesPath, "app", "dist", "backend");

// General query processing interface for Python scripts (replacement for Flask)
export async function ProcessQuery(
  event: any,
  query: Record<string, unknown>,
  mode = "json" // json, text, binary
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const args = [JSON.stringify(query)];
    let stdout = ""; // collate return data
    let stderr = ""; // collate error data

    console.log(`open [${pythonPath}]: ${args}`);
    const proc = child.spawn(pythonPath, args);

    // backend process closes; either successfully (stdout return)
    // or with an error (stderr return)
    proc.on("close", () => {
      console.log(`close: ${stdout}`);
      if (stdout === "")
        // Empty return, most likely a failure in python
        resolve({
          query: "error",
          data: {
            code: 1,
            stdout: stdout,
            stderr: stderr,
          },
        });
      // Normal return route
      else resolve(JSON.parse(stdout));
    });

    // the backend will only fail under exceptional circumstances;
    // most python related errors are relayed as stderr messages
    proc.on("error", (code: number) => {
      console.log(`error: ${code}`);
      reject({
        query: "error",
        data: {
          code: code,
          stdout: stdout,
          stderr: stderr,
        },
      });
    });

    // collate stdout data
    proc.stdout.on("data", function (data: string) {
      console.log(`stdout: ${data}`);
      stdout += data;
    });

    // collate stderr data
    proc.stderr.on("data", function (data: string) {
      console.log(`stderr: ${data}`);
      stderr += data;
    });
  });
}

// Query handlers

export async function display_FolderInfo(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function builder_GetRemoteModules(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function builder_CompileToJson(event: any, query: any) {
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

export async function builder_BuildAndRun(
  event: any,
  query: any,
  cmd_callback: any
) {
  const data = await ProcessQuery(event, query);
  // Execute the build in the working directory through the pty
  if (data["body"]["cmd"] !== "") {
    cmd_callback("cd " + data["body"]["workdir"]);
    cmd_callback(data["body"]["command"]);
  }
  return data;
}

export async function builder_CleanBuildFolder(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function runner_Build(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function runner_DeleteResults(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function runner_Lint(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function runner_LoadWorkflow(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function runner_Tokenize(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function runner_TokenizeLoad(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function runner_JobStatus(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function runner_Launch(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function runner_CheckNodeDependencies(event: any, query: any) {
  return await ProcessQuery(event, query);
}

exports.display_FolderInfo = display_FolderInfo;
exports.builder_GetRemoteModules = builder_GetRemoteModules;
exports.builder_CompileToJson = builder_CompileToJson;
exports.builder_BuildAndRun = builder_BuildAndRun;
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
