import path from "path";
import { IpcMainInvokeEvent } from "electron";
import * as os from "node:os";
import * as child from "child_process";

type Event = IpcMainInvokeEvent;
type Query = Record<string, unknown>;

const shell =
  os.platform() === "win32" ? "powershell.exe" : process.env.SHELL || "bash";

const shell_args =
  os.platform() === "win32" ? ["-NonInteractive", "-Command"] : ["-i", "-c"];

const pyrunner = path.join(
  process.resourcesPath,
  "app",
  "dist",
  "pyrunner",
  "pyrunner",
);

const condaPath = path.join(
  process.resourcesPath,
  "app",
  "dist",
  "conda",
  os.platform() === "win32" ? "condabin" : "bin",
);

const pathSeparator = os.platform() === "win32" ? ";" : ":";

// General query processing interface for Python scripts
export async function ProcessQuery(event: Event, query: Query): Promise<Query> {
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
  event: Event,
  query: Record<string, unknown>,
  conda_backend: string,
  envs: Record<string, string>,
  stdout_callback: (cmd: string) => void,
  stderr_callback: (cmd: string) => void,
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
        options,
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
