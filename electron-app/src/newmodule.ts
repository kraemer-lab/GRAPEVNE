import fs from 'fs';
import yaml from 'js-yaml';
import os from 'os';
import JSZip from 'jszip';

import * as child from 'child_process';
import * as path from 'path';
import {
  INewModuleBuildSettings,
  INewModuleStateConfig,
  INewModuleStateConfigInputFilesRow,
  INewModuleStateConfigOutputFilesRow,
} from './types';
export * from './types';

import { IpcMainInvokeEvent } from 'electron';

export type Event = IpcMainInvokeEvent;
export type Query = Record<string, unknown>;

interface IBuild {
  config: INewModuleStateConfig;
  build_settings: INewModuleBuildSettings;
}

export const Build = async ({ config, build_settings }: IBuild): Promise<Query> => {
  // If zip file is requested, we need to create a temporary folder and use it as the repository
  if (build_settings.as_zip) {
    const tempdir = fs.mkdtempSync(path.join(os.tmpdir(), 'module-'));
    if (fs.existsSync(tempdir)) {
      fs.rmdirSync(tempdir, { recursive: true });
    }
    config.repo = tempdir;
    // Setup repo
    fs.mkdirSync(path.join(tempdir, 'workflows'), { recursive: true });
  }

  // Determine module type and repo folder
  const module_type = config.ports.length == 0 ? 'sources' : 'modules';
  let root_folder = '';
  if (!config.repo || config.repo === 'Zip file') {
    // Create zip archive
    throw new Error('Zip file not supported yet');
  } else {
    // Create module directly in repository
    if (!fs.existsSync(config.repo)) {
      throw new Error('Repository does not exist: ' + config.repo);
    }
    if (!fs.existsSync(path.join(config.repo, 'workflows'))) {
      throw new Error('Repository does not contain workflows folder');
    }
    if (config.project === '') {
      throw new Error('Project name is required');
    }
    if (!fs.existsSync(path.join(config.repo, 'workflows', config.project))) {
      console.debug('Project does not exist --- creating');
      fs.mkdirSync(path.join(config.repo, 'workflows', config.project));
    }
    root_folder = path.join(config.repo, 'workflows', config.project, module_type);
    if (!fs.existsSync(root_folder)) {
      // creates 'module' or 'source' folder as required
      console.debug('Modules / Sources folder does not exist --- creating');
      fs.mkdirSync(root_folder);
    }
  }

  // Create base folder
  const module_folder = path.join(root_folder, config.foldername);

  // Create folder structure
  if (fs.existsSync(module_folder)) {
    if (build_settings.overwrite_existing_module_folder) {
      console.warn('Module folder already exists, deleting...');
      fs.rmdirSync(module_folder, { recursive: true });
    } else {
      throw new Error('Module folder already exists');
    }
  }
  fs.mkdirSync(module_folder);
  fs.mkdirSync(path.join(module_folder, 'config'));
  fs.mkdirSync(path.join(module_folder, 'workflow'));
  if (config.env) {
    fs.mkdirSync(path.join(module_folder, 'workflow', 'envs'));
  }

  // Copy script files
  if (config.scripts.length > 0) {
    fs.mkdirSync(path.join(module_folder, 'workflow', 'scripts'));
    for (const script of config.scripts) {
      const filename = path.basename(script.filename);
      fs.copyFileSync(script.filename, path.join(module_folder, 'workflow', 'scripts', filename));
      script.filename = filename;
    }
  }

  // Copy resource files
  if (config.resources.length > 0) {
    fs.mkdirSync(path.join(module_folder, 'resources'));
    for (const resource of config.resources) {
      const filename = path.basename(resource.filename);
      fs.copyFileSync(resource.filename, path.join(module_folder, 'resources', filename));
      resource.filename = filename;
    }
  }

  // Write config file
  let input_dict: Query | null;
  if (config.ports.length == 0) {
    input_dict = null;
  } else {
    input_dict = {};
    for (const port of config.ports) {
      input_dict[port] = port;
    }
  }
  const configfile = {
    input_namespace: input_dict,
    output_namespace: 'out',
    params: yaml.load(config.params as string),
  };
  fs.writeFileSync(path.join(module_folder, 'config', 'config.yaml'), yaml.dump(configfile));

  // Write Environment file
  if (config.env !== '') {
    fs.writeFileSync(
      path.join(module_folder, 'workflow', 'envs', 'env.yaml'),
      config.env as string,
    );
  }

  // Write Snakefile
  let snakefile = '';
  if (config.docstring) snakefile += `"""${config.docstring}\n"""\n`;
  snakefile += `configfile: "config/config.yaml"\n\n`;
  snakefile += `indir = config["input_namespace"]\n`;
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
  for (const input of config.input_files as INewModuleStateConfigInputFilesRow[]) {
    snakefile += `        `;
    if (input.label) snakefile += `${input.label} = `;
    snakefile += `f"results/{indir['${input.port}']}/${input.filename}",\n`;
  }
  for (const script of config.scripts) {
    snakefile += `        `;
    if (script.label) snakefile += `${script.label} = `;
    snakefile += `script("${script.filename}"),\n`;
  }
  for (const resource of config.resources) {
    snakefile += `        `;
    if (resource.label) snakefile += `${resource.label} = `;
    snakefile += `resource("${resource.filename}"),\n`;
  }
  snakefile += `    output:\n`;
  for (const output of config.output_files as INewModuleStateConfigOutputFilesRow[]) {
    snakefile += `        `;
    if (output.label) snakefile += `${output.label} = `;
    snakefile += `f"results/{outdir}/${output.filename}",\n`;
  }
  snakefile += `    ${config.command_directive}:\n`;
  snakefile += `        """\n`;
  snakefile += `        ${config.command}\n`;
  snakefile += `        """\n`;

  // Replace script. and resource. wildcards (which are actually named .input's)
  snakefile = snakefile.replace('{script.', '{input.').replace('{resource.', '{input.');

  // Write Snakefile
  fs.writeFileSync(path.join(module_folder, 'workflow', 'Snakefile'), snakefile);

  let zipfile = null;
  if (build_settings.as_zip) {
    const zipfilename = path.join(root_folder, config.foldername + '.zip');
    zipfile = await zipFolder(module_folder, zipfilename);
  }

  return {
    folder: module_folder,
    zip: zipfile,
    returncode: 0,
  };
};

export const CondaSearch = async (event: Event, query: Query): Promise<Query> => {
  const process_mamba_search_output = (json: Query) => {
    type Item = {
      id: number;
      name: string;
      version: string;
      build: string;
      channel: string;
    };

    if (json['error']) {
      return [];
    }

    const entries: Item[] = [];
    let index = 0;
    for(const key in json) {
      entries.push(
        ...(json[key] as Item[]).map((item: Item) => {
        return {
          id: index++,
          name: item['name'],
          version: item['version'],
          build: item['build'],
          channel: new URL(item['channel']).pathname.split('/').filter((s) => s!='')[0]
        }
      }));
    }

    return entries;
  };

  return new Promise((resolve, reject) => {
    let channel_args: string[] = [];
    if (query['channels']) {
      const channels = query['channels'] as string[];
      if (channels.length > 0) {
        channel_args = channels.map((c: string) => '--channel ' + c).join(' ').split(' ');
        channel_args.unshift('--override-channels');
      }
    }
    const args = ['search', query['searchterm'] as string, '--json', ...channel_args];
    let stdout = ''; // collate return data
    let stderr = ''; // collate error data

    // Launch child process; note that this does NOT use the system shell
    const proc = child.spawn('mamba', args);

    // backend process closes; either successfully (stdout return)
    // or with an error (stderr return)
    proc.on('close', () => {
      console.log(`close: ${stdout} ${stderr}`);
      if (stdout === '')
        // Empty return, most likely a failure in python
        resolve({
          query: 'error',
          returncode: 1,
          data: {
            code: 1,
            msg: 'Error calling mamba search',
            stdout: stdout,
            stderr: stderr,
          },
        });
      // Normal return route
      else {
        let json;
        try {
          json = JSON.parse(stdout);
        } catch (e) {
          let msg;
          if (e instanceof ReferenceError) {
            // JSON.parse failed
            msg = 'Error parsing mamba search output: ' + e;
          } else {
            msg = 'Unexpected error in mamba search: ' + e;
          }
          console.log(`error: ${e}`);
          reject({
            query: 'error',
            returncode: 1,
            data: {
              code: 1,
              msg: msg,
              stdout: stdout,
              stderr: stderr,
            },
          });
        }
        if (json['error']) {
          console.log(`error: ${json['error']}`);
          reject({
            query: 'error',
            returncode: 1,
            data: {
              code: 1,
              msg: json['error'],
              stdout: stdout,
              stderr: stderr,
            },
          });
        }
        resolve({
          returncode: 0,
          data: process_mamba_search_output(json as Query),
        });
      }
    });

    // the backend will only fail under exceptional circumstances;
    // most python related errors are relayed as stderr messages
    proc.on('error', (code: number) => {
      console.log(`error: ${code}`);
      reject({
        query: 'error',
        returncode: 1,
        data: {
          code: code,
          stdout: stdout,
          stderr: stderr,
        },
      });
    });

    // collate stdout data
    proc.stdout.on('data', function (data: string) {
      console.log(`stdout: ${data}`);
      stdout += data;
    });

    // collate stderr data
    proc.stderr.on('data', function (data: string) {
      console.log(`stderr: ${data}`);
      stderr += data;
    });
  });
};

/*
 * Code to zip a folder
 * https://visheshism.medium.com/node-js-archiving-essentials-zip-and-unzip-demystified-76d5471e59c1
 */
const zipFolder = async (folderPath: string, zipFilePath: string) => {
  const zip = new JSZip();

  const addFilesToZip = (zipFile: JSZip, folderPath: string, currentPath = '') => {
    const files = fs.readdirSync(path.join(folderPath, currentPath));

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const fullFilePath = path.join(folderPath, filePath);
      const stats = fs.statSync(fullFilePath);

      if (stats.isDirectory()) {
        addFilesToZip(zipFile, folderPath, filePath);
      } else {
        const fileContent = fs.readFileSync(fullFilePath);
        zipFile.file(filePath, fileContent);
      }
    }
  };

  addFilesToZip(zip, folderPath);
  return zip.generateAsync({ type: 'nodebuffer' });

  console.log(`Zip file created at: ${zipFilePath}`);
};
