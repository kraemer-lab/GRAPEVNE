import fs from "fs";
import path from "path";

import * as os from "node:os";
import * as child from "child_process";

import web from "./web";

const shell =
  os.platform() === "win32" ? "powershell.exe" : process.env.SHELL || "bash";

const shell_args =
  os.platform() === "win32" ? ["-NonInteractive", "-Command"] : ["-i", "-c"];

const pyrunner = path.join(process.resourcesPath, "app", "dist", "pyrunner", "pyrunner");

const condaPath = path.join(
  process.resourcesPath,
  "app",
  "dist",
  "conda",
  os.platform() === "win32" ? "condabin" : "bin"
);

const pathSeparator = os.platform() === "win32" ? ";" : ":";

// General query processing interface for Python scripts
export async function ProcessQuery(
  event: any,
  query: Record<string, unknown>
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const args = [JSON.stringify(query)];
    let stdout = ""; // collate return data
    let stderr = ""; // collate error data

    // Launch child process; note that this does NOT use the system shell
    console.log(`open [${pyrunner}]: ${args}`);
    const proc = child.spawn(pyrunner, args);

    // backend process closes; either successfully (stdout return)
    // or with an error (stderr return)
    proc.on("close", () => {
      console.log(`close: ${stdout} ${stderr}`);
      if (stdout === "")
        // Empty return, most likely a failure in python
        resolve({
          query: "error",
          returncode: 1,
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
        returncode: 1,
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
// (provides realtime stdout/stderr responses; used for workflow executions)
export async function RunWorkflow(
  event: any,
  query: Record<string, unknown>,
  conda_backend: string,
  envs: Record<string, string>,
  stdout_callback: (cmd: string) => void,
  stderr_callback: (cmd: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const querystr = JSON.stringify(query);

    // Set PATH to include bundled conda during snakemake calls, plus any
    // other environment variables specified by the user
    const systempath = process.env.PATH || "";
    const userpath = envs.PATH || "";
    let envpath = `${userpath}${pathSeparator}${systempath}`;
    const options = {
      cwd: (
        (query.data as Record<string, unknown>).content as Record<
          string,
          unknown
        >
      ).workdir as string,
      env: {
        ...process.env,
        ...envs,
        PATH: envpath,
      },
    };

    // Spawn child process (pyrunner) to launch python code (incl. snakemake)
    //if (conda_backend === "builtin") {
    let proc;
    const use_shell = true;
    if (use_shell) {
      // Spawn child process in an 'interactive' (-i) shell so that the shell
      // environment is loaded including PATH (and any available conda
      // configuration)
      const shell_cmd =
        os.platform() === "win32"
          ? pyrunner + " '" + querystr.replaceAll('"', '"""') + "'"
          : pyrunner + ' "' + querystr.replaceAll('"', '\\"') + '"';
      console.log("shell_cmd: ", shell_cmd);
      proc = child.spawn(
        // shell command (e.g. 'bash')
        shell,
        // shell arguments
        [...shell_args, shell_cmd],
        // environment variables
        options
      );
    } else {
      // Spawn child process directly (i.e. do not use the system shell). Note
      // that this will not load the shell environment (including PATH)
      envpath = `${condaPath}${pathSeparator}${envpath}`;
      proc = child.spawn(pyrunner, [querystr], options);
    }

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

const ErrorReturn = (query: string, err: any) => {
  console.error(query, err);
  let body = "";
  if (err === undefined) body = "undefined error";
  else if (err.response !== undefined)
    body = err.response.status + ": " + (err.response as any).statusText;
  else if (err.message !== undefined) body = ": " + err.message;
  else body = ": " + err;

  // Request error
  return {
    query: query,
    body: "ERROR " + body,
    returncode: 1,
  };
};

// Query handlers

export async function display_FolderInfo(event: any, query: any) {
  return await ProcessQuery(event, query);
}

export async function builder_GetRemoteModules(event: any, query: any) {
  // python version
  // return await ProcessQuery(event, query);

  // nodejs version
  try {
    const modules = await web.GetModulesList(query["data"]["content"]["url"]);
    return {
      query: "builder/get-remote-modules",
      body: modules,
      returncode: 0,
    };
  } catch (err: any) {
    return ErrorReturn(query, err);
  }
}

export async function builder_GetRemoteModuleConfig(event: any, query: any) {
  const config = await web.GetModuleConfig(
    query["data"]["content"]["repo"],
    query["data"]["content"]["snakefile"]
  );
  return config;
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

    // Query parameters
    const backend = query["data"]["backend"];
    const conda_backend = query["data"]["conda_backend"];
    const environment_variables = query["data"]["environment_variables"];

    // Convert environment variables string to a dictionary
    const envs = environment_variables
      .split(";")
      .reduce((acc: Record<string, string>, line: string) => {
        const [key, value] = line.split("=");
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});

    // Run the workflow
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
        console.log("Run query: " + JSON.stringify(query_run));
        await RunWorkflow(
          event,
          query_run,
          conda_backend,
          envs,
          stdout_callback,
          stderr_callback
        );
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

  data["returncode"] = 0;
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
  data["returncode"] = 0;
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
