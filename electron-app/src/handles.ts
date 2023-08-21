import fs from "fs";
import path from "path";
import * as child from "child_process";
import web from "./web";

const pythonPath = path.join(process.resourcesPath, "app", "dist", "backend");
const condaPath = path.join(process.resourcesPath, "app", "dist", "conda", "bin");

// General query processing interface for Python scripts (replacement for Flask)
export async function ProcessQuery(
  event: any,
  query: Record<string, unknown>
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
      console.log(`close: ${stdout} ${stderr}`);
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

// General query processing interface for Python scripts
// (provides realtime stdout/stderr responses)
export async function RunWorkflow(
  event: any,
  query: Record<string, unknown>,
  stdout_callback: (cmd: string) => void,
  stderr_callback: (cmd: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [JSON.stringify(query)];

    // Set PATH to include bundled conda during snakemake calls
    const path = `${condaPath}:${process.env.PATH}`;
    const proc = child.spawn(
      pythonPath,
      args,
      {env: {...process.env, PATH: path}}
    );

    // backend process closes; either successfully (stdout return)
    // or with an error (stderr return)
    proc.on("close", () => {
      console.log(`close:`);
      resolve(void 0);
    });

    // the backend will only fail under exceptional circumstances;
    // most python related errors are relayed as stderr messages
    proc.on("error", (code: number) => {
      console.log(`error: ${code}`);
      reject();
    });

    // collate stdout data
    proc.stdout.on("data", function (data: string) {
      console.log(`stdout: ${data}`);
      stdout_callback(data);
    });

    // collate stderr data
    proc.stderr.on("data", function (data: string) {
      console.log(`stderr: ${data}`);
      stderr_callback(data);
    });
  });
}

// Query handlers

export async function display_FolderInfo(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function builder_GetRemoteModules(event: any, query: any) {
  // python version
  //return await ProcessQuery(event, query);

  // nodejs version
  const modules = await web.GetModulesList(query["data"]["content"]["url"]);
  return {
    query: "builder/get-remote-modules",
    body: modules,
  };
}

export async function builder_CompileToJson(event: any, query: any) {
  // Note: Instead of returning the zip file as a base64 string from Python
  //       (as was the procedure in the REST implementation), we instead rely
  //       on Python saving the zip file to disk, then reading it back in.
  const data = await ProcessQuery(event, query);
  return fs.readFileSync(data["body"]["zipfile"], {
    encoding: "base64",
  });
}

export async function builder_BuildAndRun(
  event: any,
  query: any,
  cmd_callback: (cmd: string) => void,
  stdout_callback: (cmd: string) => void,
  stderr_callback: (cmd: string) => void
) {
  stdout_callback("Building workflow...");
  const data = await ProcessQuery(event, query);
  // Execute the build in the working directory through the pty
  if (data["body"]["command"] !== "") {
    stdout_callback("Running workflow...");
    cmd_callback("cd " + data["body"]["workdir"]);
    const backend = query["data"]["backend"];
    let query_run = {};
    switch (backend) {
      case "builtin":
        query_run = {
          query: "runner/snakemake-run",
          data: {
            format: "Snakefile",
            content: {
              workdir: data["body"]["workdir"],
              command: data["body"]["command"],
            },
          },
        };
        await RunWorkflow(event, query_run, stdout_callback, stderr_callback);
        stdout_callback("Workflow complete.");
        break;
      case "system":
        cmd_callback(data["body"]["command"]);
        break;
      default:
        console.log("Unknown Snakemake backend requested: " + backend);
    }
  } else {
    stdout_callback("No workflow command to run.");
  }
  return data;
}

export async function builder_CleanBuildFolder(
  event: any,
  query: any,
  status_callback: (status: string) => void
) {
  status_callback("Cleaning build folder...");
  const data = await ProcessQuery(event, query);
  status_callback("Build folder cleaned.");
  return data;
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
