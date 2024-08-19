import axios from 'axios';
import fs from 'fs';
import web from './web';

import { dialog, IpcMainInvokeEvent, shell } from 'electron';
import { Build, CondaSearch, INewModuleState } from './newmodule';
import { ProcessQuery, RunWorkflow } from './pyrunner';

async function loadStore() {
  const { default: Store } = await import('electron-store');
  return new Store();
}

type Event = IpcMainInvokeEvent;
type Query = Record<string, unknown>;

///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////

const ErrorReturn = (query: string, err: Query) => {
  console.error(query, err);
  let body = '';
  if (err === undefined) body = 'undefined error';
  else if (err.response !== undefined)
    body = (err.response as Query).status + ': ' + (err.response as Query).statusText;
  else if (err.message !== undefined) body = ': ' + err.message;
  else body = ': ' + err;

  // Request error
  return {
    query: query,
    body: {
      msg: 'ERROR ' + body,
    },
    returncode: 1,
  };
};

const SafeProcessQuery = async (
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) => {
  try {
    const data = await ProcessQuery(event, query);
    if (data['returncode'] !== 0) {
      stderr_callback('Error processing query.');
      stderr_callback((data['data'] as Query)['stderr'] as string);
      return ErrorReturn(query.query as string, data);
    }
    return data;
  } catch (err) {
    stderr_callback('Error processing query.');
    stderr_callback(err as string);
    return ErrorReturn(query.query as string, err as Query);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Display query handlers
///////////////////////////////////////////////////////////////////////////////

export async function display_FolderInfo(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  return await SafeProcessQuery(event, query, stderr_callback);
}

export async function display_SelectFolder(
  event: Event,
  path: string,
  win: Electron.BrowserWindow,
) {
  const result = await dialog.showOpenDialog(win, {
    defaultPath: path,
    properties: ['openDirectory'],
  });
  return result.filePaths;
}

export async function display_SelectFile(event: Event, path: string, win: Electron.BrowserWindow) {
  const result = await dialog.showOpenDialog(win, {
    defaultPath: path,
    properties: ['openFile'],
  });
  return result.filePaths;
}

///////////////////////////////////////////////////////////////////////////////
// Builder query handlers
///////////////////////////////////////////////////////////////////////////////

export async function builder_GetRemoteModules(event: Event, query: Query) {
  try {
    const modules = await web.GetModulesList(((query['data'] as Query)['content'] as Query)['url']);
    return {
      query: 'builder/get-remote-modules',
      body: modules,
      returncode: 0,
    };
  } catch (err) {
    return ErrorReturn(query.query as string, err as Query);
  }
}

export async function builder_GetRemoteModuleConfig(event: Event, query: Query) {
  const config = await web.GetModuleConfig(
    ((query['data'] as Query)['content'] as Query)['repo'],
    ((query['data'] as Query)['content'] as Query)['snakefile'],
  );
  return config;
}

export async function builder_GetModuleConfigFilesList(event: Event, snakefile: Query | string) {
  return await web.GetModuleConfigFilesList(snakefile);
}

export async function builder_BuildAsModule(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  // This implementation relies on Python saving the zip file to disk, then
  // reading it back in.
  const data = await ProcessQuery(event, query);
  if (data['returncode'] !== 0) {
    stderr_callback('Error building module.');
    stderr_callback((data['data'] as Query)['stderr'] as string);
    return ErrorReturn(query.query as string, data);
  }
  if (!(query['data'] as Query)['build_path']) {
    // Module built to folder
    return null;
  }
  // Module returned as zip file
  return fs.readFileSync((data['body'] as Query)['zipfile'] as string, {
    encoding: 'base64',
  });
}

export async function builder_BuildAsWorkflow(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  // This implementation relies on Python saving the zip file to disk, then
  // reading it back in.
  const data = await ProcessQuery(event, query);
  if (data['returncode'] !== 0) {
    stderr_callback('Error building workflow.');
    stderr_callback((data['data'] as Query)['stderr'] as string);
    return ErrorReturn(query.query as string, data);
  }
  return fs.readFileSync((data['body'] as Query)['zipfile'] as string, {
    encoding: 'base64',
  });
}

export async function builder_BuildAndRun(
  event: Event,
  query: Query,
  cmd_callback: (cmd: string) => void,
  stdout_callback: (cmd: string) => void,
  stderr_callback: (cmd: string) => void,
) {
  stdout_callback('Building workflow...');
  const data = await ProcessQuery(event, query);
  if (data['returncode'] !== 0) {
    stderr_callback('Error building workflow.');
    stderr_callback((data['data'] as Query)['stderr'] as string);
    return ErrorReturn(query.query as string, data);
  }

  // Execute the build in the working directory through the pty
  if ((data['body'] as Query)['command'] !== '') {
    stdout_callback('Running workflow...');
    cmd_callback('cd ' + (data['body'] as Query)['workdir']);

    // Query parameters
    const backend = (query['data'] as Query)['backend'] as string;
    const conda_backend = (query['data'] as Query)['conda_backend'] as string;
    const environment_variables = (query['data'] as Query)['environment_variables'] as string;

    // Convert environment variables string to a dictionary
    const envs = environment_variables
      .split(';')
      .reduce((acc: Record<string, string>, line: string) => {
        const [key, value] = line.split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});

    // Run the workflow
    let query_run: Query;
    switch (backend) {
      case 'builtin':
        query_run = {
          query: 'runner/snakemake-run',
          data: {
            format: 'Snakefile',
            content: {
              workdir: (data['body'] as Query)['workdir'],
              command: (data['body'] as Query)['command'],
            },
          },
        };
        console.log('Run query: ' + JSON.stringify(query_run));
        await RunWorkflow(event, query_run, conda_backend, envs, stdout_callback, stderr_callback);
        stdout_callback('Workflow complete.');
        break;

      case 'system':
        cmd_callback((data['body'] as Query)['command'] as string);
        break;

      default:
        console.log('Unknown Snakemake backend requested: ' + backend);
    }
  } else {
    stdout_callback('No workflow command to run.');
  }

  data['returncode'] = 0;
  return data;
}

export async function builder_CleanBuildFolder(
  event: Event,
  query: Query,
  status_callback: (status: string) => void,
) {
  status_callback('Cleaning build folder...');
  const data = await ProcessQuery(event, query);
  status_callback('Build folder cleaned.');
  data['returncode'] = 0;
  return data;
}

export async function builder_OpenResultsFolder(event: Event, workdir: string) {
  shell.showItemInFolder(workdir);
  return { query: 'builder/open-results-folder', body: 'OK', returncode: 0 };
}

export async function builder_GetFile(event: Event, filename: string): Promise<string> {
  if (filename.startsWith('http')) {
    // Remote filename
    try {
      const response = await axios.get(filename);
      return response.data;
    } catch (err) {
      console.error('Error getting remote file: ' + filename);
      return '';
    }
  } else {
    // Local file
    return fs.readFileSync(filename as string, { encoding: 'utf8' });
  }
}

export async function builder_GetConfigFilenameFromSnakefile(
  event: Event,
  snakefile: Query | string,
) {
  return await web.getConfigFilenameFromSnakefile(snakefile);
}

///////////////////////////////////////////////////////////////////////////////
// Runner query handlers
///////////////////////////////////////////////////////////////////////////////

export async function runner_Build(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  const data = await ProcessQuery(event, query);
  if (data['returncode'] !== 0) {
    stderr_callback('Error building workflow.');
    stderr_callback((data['data'] as Query)['stderr'] as string);
    return ErrorReturn(query.query as string, data);
  }
  return data;
}

export async function runner_DeleteResults(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  return await SafeProcessQuery(event, query, stderr_callback);
}

export async function runner_Lint(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  return await SafeProcessQuery(event, query, stderr_callback);
}

export async function runner_LoadWorkflow(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  return await SafeProcessQuery(event, query, stderr_callback);
}

export async function runner_Tokenize(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  return await SafeProcessQuery(event, query, stderr_callback);
}

export async function runner_TokenizeLoad(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  return await SafeProcessQuery(event, query, stderr_callback);
}

export async function runner_JobStatus(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  return await SafeProcessQuery(event, query, stderr_callback);
}

export async function runner_Launch(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  return await SafeProcessQuery(event, query, stderr_callback);
}

export async function runner_CheckNodeDependencies(
  event: Event,
  query: Query,
  stderr_callback: (cmd: string) => void,
) {
  return await SafeProcessQuery(event, query, stderr_callback);
}

///////////////////////////////////////////////////////////////////////////////
// New Module query handlers
///////////////////////////////////////////////////////////////////////////////

export async function newmodule_Build(event: Event, moduleState: INewModuleState) {
  console.log('Received NewModule Build request');
  const config = moduleState.config;
  console.log('Config: ' + JSON.stringify(config, null, 2));
  try {
    const response = await Build({
      config: config,
      build_settings: moduleState.build,
    });
    return {
      query: 'newmodule/build',
      body: {
        folder: response.folder,
        zip: response.zip,
      },
      returncode: response.returncode,
    };
  } catch (err) {
    return ErrorReturn('newmodule/build', err as Query);
  }
}

export async function newmodule_CondaSearch(event: Event, query: Query) {
  console.log('Received CondaSearch request');
  try {
    return await CondaSearch(event, query);
  } catch (err) {
    return ErrorReturn('newmodule/conda-search', err as Query);
  }
}

export async function newmodule_OpenModuleFolder(event: Event, folder: string) {
  shell.showItemInFolder(folder);
  return { query: 'newmodule/open-module-folder', body: 'OK', returncode: 0 };
}

///////////////////////////////////////////////////////////////////////////////
// Settings query handlers
///////////////////////////////////////////////////////////////////////////////

export async function settings_StoreReadConfig(event: Event) {
  // Set up electron-store (persistent local configuration)
  const store = await loadStore();
  const config = store.get('config');
  return config;
}

export async function settings_StoreWriteConfig(event: Event, data: Query) {
  // Set up electron-store (persistent local configuration)
  const store = await loadStore();
  store.set('config', data);
  return store.get('config');
}
