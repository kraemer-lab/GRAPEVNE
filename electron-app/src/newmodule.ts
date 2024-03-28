import fs from "fs";
import yaml from "js-yaml";

import * as path from "path";
import * as child from "child_process";
import {
  INewModuleStateConfig,
  INewModuleStateConfigInputFilesRow,
  INewModuleStateConfigOutputFilesRow,
} from './types';
export * from './types';

import { IpcMainInvokeEvent } from "electron";

type Event = IpcMainInvokeEvent;
type Query = Record<string, unknown>;

export async function Build(event: Event, config: INewModuleStateConfig) {

  // Determine module type and repo folder
  const module_type = config.ports.length == 0 ? "source" : "module";
  let root_folder = "";
  if (!config.repo || config.repo === "Zip file") {
    // Create zip archive
    throw new Error("Zip file not supported yet");
  } else {
    // Create module directly in repository
    if (!fs.existsSync(config.repo)) {
      throw new Error("Repository does not exist");
    }
    if (!fs.existsSync(path.join(config.repo, "workflows"))) {
      throw new Error("Repository does not contain workflows folder");
    }
    if (config.project === "") {
      throw new Error("Project name is required");
    }
    if (!fs.existsSync(path.join(config.repo, "workflows", config.project))) {
      console.log("Project does not exist --- creating project folder");
      fs.mkdirSync(path.join(config.repo, "workflows", config.project));
    }
    root_folder = path.join(config.repo, "workflows", config.project, module_type);
    if (!fs.existsSync(root_folder)) {  // creates 'module' or 'source' folder as required
      fs.mkdirSync(root_folder);
    }
  }

  // Create base folder
  const module_folder = path.join(root_folder, config.foldername);

  // Create folder structure
  if (fs.existsSync(module_folder)) {
    console.warn("Module folder already exists, deleting...");
    fs.rmdirSync(module_folder, { recursive: true });
  }
  fs.mkdirSync(module_folder);
  fs.mkdirSync(path.join(module_folder, "config"));
  fs.mkdirSync(path.join(module_folder, "workflow"));
  if (config.env) {
    fs.mkdirSync(path.join(module_folder, "workflow", "envs"));
  }

  // Copy script files
  if (config.scripts.length > 0) {
    fs.mkdirSync(path.join(module_folder, "workflow", "scripts"));
    for(const script of config.scripts) {
      const filename = path.basename(script.filename);
      fs.copyFileSync(script.filename, path.join(module_folder, "workflow", "scripts", filename));
      script.filename = filename;
    }
  }

  // Copy resource files
  if (config.resources.length > 0) {
    fs.mkdirSync(path.join(module_folder, "resources"));
    for(const resource of config.resources) {
      const filename = path.basename(resource.filename);
      fs.copyFileSync(resource.filename, path.join(module_folder, "resources", filename));
      resource.filename = filename;
    }
  }

  // Write config file
  const configfile = {
    input_namespace: "in",
    output_namespace: "out",
    params: yaml.load(config.params as string),
  };
  fs.writeFileSync(
    path.join(module_folder, "config", "config.yaml"),
    yaml.dump(configfile),
  );

  // Write Environment file
  if (config.env !== "") {
    fs.writeFileSync(
      path.join(module_folder, "workflow", "envs", "env.yaml"),
      config.env as string,
    );
  }

  // Write Snakefile
  let snakefile = "";
  if (config.docstring)
    snakefile += `"""${config.docstring}\n"""\n`;
  snakefile += `configfile: "config/config.yaml"\n\n`;
  snakefile += `indir = config["input_namespace"]\n\n`;
  snakefile += `outdir = config["output_namespace"]\n\n`;
  if (config.scripts.length > 0) {
    snakefile += `def script(name=""):\n`;
    snakefile += `    from snakemake.remote import AUTO\n\n`;
    snakefile += `    filename = srcdir(f"scripts/{name})"\n`;
    snakefile += `    try:\n`;
    snakefile += `        return AUTO.remote(filename)\n`;
    snakefile += `    except: TypeError:\n`;
    snakefile += `        return filename\n\n`;
  }
  if (config.resources.length > 0) {
    snakefile += `def resource(name=""):\n`;
    snakefile += `    from snakemake.remote import AUTO\n\n`;
    snakefile += `    filename = srcdir(f"../resources/{name})"\n`;
    snakefile += `    try:\n`;
    snakefile += `        return AUTO.remote(filename)\n`;
    snakefile += `    except: TypeError:\n`;
    snakefile += `        return filename\n\n`;
  }
  snakefile += `rule all:\n`;
  snakefile += `    input:\n`;
  for(const input of config.input_files as INewModuleStateConfigInputFilesRow[]) {
    snakefile += `        `;
    if (input.label)
      snakefile += `${input.label} = `;
    snakefile += `f"results/{indir["${input.port}"]}/${input.filename}",\n`;
  }
  for(const output of config.output_files as INewModuleStateConfigOutputFilesRow[]) {
    snakefile += `        `;
    if (output.label)
      snakefile += `${output.label} = `;
    snakefile += `f"results/{outdir}/${output.filename}",\n`;
  }
  for (const script of config.scripts) {
    snakefile += `        `;
    if (script.label)
      snakefile += `${script.label} = `;
    snakefile += `script("${script.filename}"),\n`;
  }
  for (const resource of config.resources) {
    snakefile += `        `;
    if (resource.label)
      snakefile += `${resource.label} = `;
    snakefile += `resource("${resource.filename}"),\n`;
  }
  snakefile += `    output:\n`;
  snakefile += `    ${config.command_directive}:\n`;
  snakefile += `        """\n`;
  snakefile += `        ${config.command}\n`;
  snakefile += `        """\n`;
  fs.writeFileSync(path.join(module_folder, "workflow", "Snakefile"), snakefile);

  return {"return": "build return"};
}

export async function CondaSearch(event: Event, query: Query) {
  const process_mamba_search_output = (output: string) => {
    // Find header line of package list
    const start = output.indexOf("# Name");
    const lines = output
      .substring(start)  // Remove leading lines
      .split("\n")  // Split into lines
      .slice(1);  // Remove header line
    if (!lines) return [];
    const columns = lines
      .map(
        (line: string) =>
          line
            .split(" ")  // Split by spaces (can be multiple between columns)
            .filter((n: string) => n)  // Remove empty columns
      )
      .filter((n) => n.length > 0);  // Remove empty lines
    columns.forEach((line, index) => line.unshift(index.toString()));
    return columns.map((r) => ({
      id: r[0],
      name: r[1],
      version: r[2],
      build: r[3],
      channel: r[4],
    }));
  };

  return new Promise((resolve, reject) => {
    const args = ["search", query["searchterm"] as string];
    let stdout = ""; // collate return data
    let stderr = ""; // collate error data

    // Launch child process; note that this does NOT use the system shell
    const proc = child.spawn("mamba", args);

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
      else resolve({
        "returncode": 0,
        "data": process_mamba_search_output(stdout),
      });
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
