import fs from "fs";
import web from "./web";
import { IpcMainInvokeEvent } from "electron";
import { RunWorkflow } from "./pyrunner";
import { ProcessQuery } from "./pyrunner";
import Store from "electron-store";

type Event = IpcMainInvokeEvent;
type Query = Record<string, unknown>;

///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////

const ErrorReturn = (query: string, err: Query) => {
  console.error(query, err);
  let body = "";
  if (err === undefined) body = "undefined error";
  else if (err.response !== undefined)
    body =
      (err.response as Query).status +
      ": " +
      (err.response as Query).statusText;
  else if (err.message !== undefined) body = ": " + err.message;
  else body = ": " + err;

  // Request error
  return {
    query: query,
    body: "ERROR " + body,
    returncode: 1,
  };
};

///////////////////////////////////////////////////////////////////////////////
// Display query handlers
///////////////////////////////////////////////////////////////////////////////

export async function display_FolderInfo(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}

export async function display_StoreReadConfig(event: Event, store: Store) {
  // Set up electron-store (persistent local configuration)
  const config = store.get('config');
  return config;
}

export async function display_StoreWriteConfig(event: Event, store: Store, data: Query) {
  // Set up electron-store (persistent local configuration)
  store.set('config', data);
  return store.get('config');
}

///////////////////////////////////////////////////////////////////////////////
// Builder query handlers
///////////////////////////////////////////////////////////////////////////////

export async function builder_GetRemoteModules(event: Event, query: Query) {
  try {
    const modules = await web.GetModulesList(
      ((query["data"] as Query)["content"] as Query)["url"]
    );
    return {
      query: "builder/get-remote-modules",
      body: modules,
      returncode: 0,
    };
  } catch (err) {
    return ErrorReturn(query.query as string, err as Query);
  }
}

export async function builder_GetRemoteModuleConfig(
  event: Event,
  query: Query
) {
  const config = await web.GetModuleConfig(
    ((query["data"] as Query)["content"] as Query)["repo"],
    ((query["data"] as Query)["content"] as Query)["snakefile"]
  );
  return config;
}

export async function builder_BuildAsModule(event: Event, query: Query) {
  // This implementation relies on Python saving the zip file to disk, then
  // reading it back in.
  const data = await ProcessQuery(event, query);
  return fs.readFileSync((data["body"] as Query)["zipfile"] as string, {
    encoding: "base64",
  });
}

export async function builder_BuildAsWorkflow(event: Event, query: Query) {
  // This implementation relies on Python saving the zip file to disk, then
  // reading it back in.
  const data = await ProcessQuery(event, query);
  return fs.readFileSync((data["body"] as Query)["zipfile"] as string, {
    encoding: "base64",
  });
}

export async function builder_BuildAndRun(
  event: Event,
  query: Query,
  cmd_callback: (cmd: string) => void,
  stdout_callback: (cmd: string) => void,
  stderr_callback: (cmd: string) => void
) {
  stdout_callback("Building workflow...");
  const data = await ProcessQuery(event, query);

  // Execute the build in the working directory through the pty
  if ((data["body"] as Query)["command"] !== "") {
    stdout_callback("Running workflow...");
    cmd_callback("cd " + (data["body"] as Query)["workdir"]);

    // Query parameters
    const backend = (query["data"] as Query)["backend"] as string;
    const conda_backend = (query["data"] as Query)["conda_backend"] as string;
    const environment_variables = (query["data"] as Query)[
      "environment_variables"
    ] as string;

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
              workdir: (data["body"] as Query)["workdir"],
              command: (data["body"] as Query)["command"],
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
        cmd_callback((data["body"] as Query)["command"] as string);
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
  event: Event,
  query: Query,
  status_callback: (status: string) => void
) {
  status_callback("Cleaning build folder...");
  const data = await ProcessQuery(event, query);
  status_callback("Build folder cleaned.");
  data["returncode"] = 0;
  return data;
}

///////////////////////////////////////////////////////////////////////////////
// Runner query handlers
///////////////////////////////////////////////////////////////////////////////

export async function runner_Build(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}

export async function runner_DeleteResults(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}

export async function runner_Lint(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}

export async function runner_LoadWorkflow(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}

export async function runner_Tokenize(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}

export async function runner_TokenizeLoad(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}

export async function runner_JobStatus(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}

export async function runner_Launch(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}

export async function runner_CheckNodeDependencies(event: Event, query: Query) {
  return await ProcessQuery(event, query);
}
