import axios from 'axios';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const url_github = 'https://api.github.com/repos';
let manifest: Record<string, unknown> = {};
const manifest_path = 'manifest.json';

const GetModuleConfig = async (
  repo: Record<string, unknown>,
  snakefile: Record<string, unknown> | string,
) => {
  /* Returns both the config file, and the workflow docstring, if it exists */
  const config = (await GetModuleConfigFile(repo, snakefile)) as Record<string, unknown>;
  config['docstring'] = (await GetModuleDocstring(repo, snakefile)) as string;
  return config;
};

const GetModuleConfigFile = async (
  repo: Record<string, unknown>,
  snakefile: Record<string, unknown> | string,
) => {
  console.log('GetModuleConfig: ', repo);
  let workflow_url = '';
  let config_url = '';
  let snakefile_str = '';
  switch (repo['type']) {
    case 'github':
      snakefile_str = (snakefile as Record<string, Record<string, string>>)['kwargs']['path'];
      workflow_url =
        'https://raw.githubusercontent.com/' + (repo.repo as string) + '/main/' + snakefile_str;
      // Strip 'workflow/Snakefile' and replace with 'config/config.yaml'
      // TODO: Read Snakefile and look for config file at relative path
      config_url = workflow_url;
      config_url = config_url.substring(0, config_url.lastIndexOf('/'));
      config_url = config_url.substring(0, config_url.lastIndexOf('/'));
      config_url += '/config/config.yaml';
      return await axios
        .get(config_url)
        .then((response) => {
          return yaml.load(response.data) as Record<string, unknown>;
        })
        .catch(() => {
          console.log('No (or invalid YAML) config file found.');
          return {};
        });
      break;
    case 'local':
      workflow_url = snakefile as string;
      config_url = workflow_url;
      config_url = config_url.substring(0, config_url.lastIndexOf(path.sep));
      config_url = config_url.substring(0, config_url.lastIndexOf(path.sep));
      config_url = path.join(config_url, 'config', 'config.yaml');
      try {
        return yaml.load(fs.readFileSync(config_url, 'utf8')) as Record<string, unknown>;
      } catch (err) {
        console.log('No (or invalid YAML) config file found.');
      }
      break;
    default:
      throw new Error('Invalid url type: ' + repo['type']);
  }
};

const GetModuleDocstring = async (
  repo: Record<string, unknown>,
  snakefile: Record<string, unknown> | string,
) => {
  console.log('GetModuleConfig: ', repo);
  let workflow_url = '';
  let snakefile_str = '';
  switch (repo['type']) {
    case 'github':
      snakefile_str = (snakefile as Record<string, Record<string, string>>)['kwargs']['path'];
      workflow_url =
        'https://raw.githubusercontent.com/' + (repo.repo as string) + '/main/' + snakefile_str;
      return await axios
        .get(workflow_url)
        .then((response) => {
          return ParseDocstring(response.data);
        })
        .catch(() => {
          console.log('No (or invalid) workflow file.');
          return {};
        });
      break;
    case 'local':
      workflow_url = snakefile as string;
      try {
        return ParseDocstring(fs.readFileSync(workflow_url, 'utf8'));
      } catch (err) {
        console.log('No (or invalid) workflow file.');
      }
      break;
    default:
      throw new Error('Invalid url type: ' + repo['type']);
  }
};

const ParseDocstring = (snakefile: string): string => {
  /*
   * Parse docstring from workflow file contents
   */
  let docstring = '';
  const lines = snakefile.split('\n');
  // docstring must be at the top of the file
  if (!lines[0].startsWith('"""')) {
    return docstring;
  }
  docstring += lines[0].split('"""')[1];
  lines.shift();
  for (const line of lines) {
    if (line === '"""') {
      break;
    }
    docstring += '\n' + line;
  }
  return docstring;
};

const GetModulesList = async (
  url: Record<string, unknown> | Record<string, unknown>[],
): Promise<Array<Record<string, unknown>>> => {
  // Process multiple urls if input is an array
  if (Array.isArray(url)) {
    console.log('GetModulesList (parsing repository list): ', url);
    const modules = [];
    for (const u of url) {
      modules.push(await GetModulesList(u));
    }
    return modules.flat();
  }
  // Process single url if input is a dict
  console.log('GetModulesList (loading modules from repository): ', url);
  switch (url['type']) {
    case 'github':
      return GetRemoteModulesGithub(url['repo'] as string, url['listing_type'] as string);
    case 'local':
      return GetLocalModules(url['repo'] as string);
    default:
      throw new Error('Invalid url type: ' + url['type']);
  }
};

const GetFolders = (root_folder: string): Array<string> => {
  return fs
    .readdirSync(root_folder, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .map((f) => f.name);
}

const GetLocalModules = (root_folder: string): Array<Record<string, unknown>> => {
  // static return for now
  const path_base = path.join(path.resolve(root_folder), 'workflows');

  // Get list of local filesystem directories in path
  const orgs = GetFolders(path_base);

  // First-level (organisation) listing
  const modules = [];
  for (const org of orgs) {
    const org_path = path.join(path_base, org);
    const module_types = GetFolders(org_path).reverse();

    // Second-level (module type) listing
    for (const module_type of module_types) {
      const module_type_path = path.join(org_path, module_type);
      const workflows = GetFolders(module_type_path).sort();

      // Third-level (module/workflow) listing
      for (const workflow of workflows) {
        const url_workflow = path.join(path_base, org, module_type, workflow, 'workflow/Snakefile');
        const config_file = path.join(path_base, org, module_type, workflow, 'config/config.yaml');

        let config = {};
        let module_classification = module_type.slice(0, -1); // remove plural
        modules.push({
          name: FormatName(workflow),
          type: module_classification,
          org: org,
          repo: {
            type: 'local',
            listing_type: 'DirectoryListing',
            url: root_folder,
          },
          config: {
            snakefile: url_workflow,
            config: config,
          },
        });
      }
    }
  }
  return modules;
};

const GetRemoteModulesGithub = async (
  repo: string,
  listing_type: string,
): Promise<Record<string, unknown>[]> => {
  switch (listing_type) {
    case 'DirectoryListing':
      return GetRemoteModulesGithubDirectoryListing(repo);
    default:
      throw new Error('Invalid Github listing type.');
  }
};

const checkManifest = (repo: string, branch: string) => {
  let exists = false;
  Object.keys(manifest).forEach((key) => {
    if (key === repo) {
      if (manifest[key])
        exists = true;
    }
  });
  return exists;
}

const populateManifest = async (repo: string, branch: string) => {
  // Add / refresh manifest - typically called on Module Load (infrequent)

  // Attempt to populate manifest file
  const manifest_url = ['https://raw.githubusercontent.com', repo, branch, manifest_path].join('/');
  const response = await axios.get(manifest_url)
    .then((response) => response.data)
    .then((data) => {
      // may return undefined
      if (data) {
        manifest[repo] = data;
      }
    })
    .catch((e) => {
      console.log('Could not retrieve a manifest file.');
    });
}

const getManifest = (repo: string, branch: string): Record<string, unknown> => {
  if (checkManifest(repo, branch)) {
    return manifest[repo] as Record<string, unknown>;
  } else {
    return {};
  }
}

const api_get = async (url: string, url_base: string): Promise<Record<string, string>[]> => {
  // Attempt to look up folder contents in the manifest file; if the manifest file does
  // not exist, then resort to an API request (these can be rate limited)

  if (url.includes(url_github)) {
    // Extract repo from url
    const repo = url.replace(url_github + "/", '').split('/').slice(0, 2).join('/');
    const branch = "main";  // only main branch manifest is available
    const manifest_repo = getManifest(repo, branch);
    if (Object.keys(manifest_repo).length > 0) {
      // Look up item in manifest file
      console.debug('Looking up in manifest: ', url);
      const manifest_key = url.replace(url_base, '');
      const path = manifest_key.split('/').filter((item) => item !== '');
      let contents = manifest_repo['children'] as Record<string, unknown>[];
      let workflows = contents.find((item: Record<string, unknown>) => item['name'] === 'workflows') as Record<string, unknown>;
      let data = workflows['children'] as Record<string, unknown>[];
      for (const p of path) {
        const datum = data.find((item: Record<string, unknown>) => item['name'] === p);
        if (!datum) {
          console.debug('Could not find item in manifest: ', p);
          return [];
        }
        data = datum['children'] as Record<string, unknown>[];
      }
      // Format data for return
      const out: Record<string, string>[] = [];
      for (const item of data) {
        if (item['type'] === 'folder')
          item['type'] = 'dir';
        out.push({
          name: item['name'] as string,
          type: item['type'] as string,
        });
      }
      return out;
    }
  }
  // API request (risks hitting github rate limit)
  try {
    const response = await axios.get(url);
    return await response.data;
  } catch (e) {
    console.log('Could not retrieve requested url: ', url);
  }
  return [];
}

const GetRemoteModulesGithubDirectoryListing = async (
  repo: string,
): Promise<Record<string, unknown>[]> => {
  const url_base: string = [url_github, repo, 'contents/workflows'].join('/');
  const branch = 'main';
  const modules: Array<Record<string, unknown>> = [];

  // Attempt to populate manifest (if it does not already exist)
  await populateManifest(repo, branch);

  // Redirect get request to allow manifest intercept if possible
  async function get(url: string) {
    return api_get(url, url_base);
  }

  // Get latest commit of main branch (explit use of axios here; not manifest)
  const commit = await axios.get([url_github, repo, "commits", branch].join('/'))
    .then((response) => response.data)
    .then((data) => {
      return data['sha'];
    })
    .catch(() => {
      console.log('Could not identify latest commit.');
      return '';
    });

  // First-level (organisation) listing
  const orgs = await get(url_base).then((data) => {
    return data
      .filter((org: Record<string, string>) => org['type'] == 'dir')
      .map((org: Record<string, string>) => org['name']);
  });
  for (const org of orgs) {
    const url_org = [url_base, org].join('/');
    const module_types = await get(url_org).then((data) => {
      return data
        .filter((module_type: Record<string, string>) => module_type['type'] == 'dir')
        .map((module_type: Record<string, string>) => module_type['name'])
        .reverse();
    });

    // Second-level (module type) listing
    for (const module_type of module_types) {
      const url_workflow = [url_org, module_type].join('/');
      const workflows = await get(url_workflow).then((data) => {
        return data
          .filter((workflow: Record<string, string>) => workflow['type'] == 'dir')
          .map((workflow: Record<string, string>) => workflow['name']);
      });

      // Third-level (module/workflow) listing
      for (const workflow of workflows) {
        const url_config = [
          'https://raw.githubusercontent.com',
          repo,
          branch,
          'workflows',
          org,
          module_type,
          workflow,
          'config/config.yaml',
        ].join('/');

        let config = {};
        let module_classification = module_type.slice(0, -1);
        let snakefile = {};
        // If commit is specified, use that, otherwise use branch
        if (commit !== '') {
          snakefile = {
            function: 'github',
            args: [repo],
            kwargs: {
              path: `workflows/${org}/${module_type}/${workflow}/workflow/Snakefile`,
              commit: commit,
            },
          };
        } else {
          snakefile = {
            function: 'github',
            args: [repo],
            kwargs: {
              path: `workflows/${org}/${module_type}/${workflow}/workflow/Snakefile`,
              branch: branch,
            },
          };
        }
        // Module specification
        const module = {
          name: FormatName(workflow),
          type: module_classification,
          org: org,
          repo: {
            type: 'github',
            listing_type: 'DirectoryListing',
            url: repo,
          },
          config: {
            snakefile: snakefile,
            config: config,
          },
        };
        modules.push(module);
      }
    }
  }
  return modules;
};

const FormatName = (name: string): string => {
  return name;
};

const GetModuleClassification = (config: Record<string, unknown>): string => {
  // If config is None, then default to module
  if (config === null || config === undefined) {
    return 'module';
  }
  // If the input namespace exists and is anything other than null, then it is
  // a module
  if (!Object.hasOwn(config, 'input_namespace'))
    // Missing input_namespace is treated as an empty string
    return 'module';
  if (config['input_namespace'] === null) return 'source';
  return 'module';
};

const getBranchOrCommit = (snakefile: Record<string, unknown>) => {
  const kwargs = snakefile.kwargs as Record<string, string>;
  if (Object.hasOwn(kwargs, 'commit')) {
    return kwargs['commit'];
  } else if (Object.hasOwn(kwargs, 'branch')) {
    return kwargs['branch'];
  } else {
    throw new Error('Branch or commit not specified');
  }
}

const getConfigFilenameFromSnakefile = async(
  snakefile: Record<string, unknown> | string | null,
): Promise<string | null> => {
  if (typeof snakefile === 'string') {
    // Local repository
    return getConfigFilenameFromSnakefile_Local(snakefile as string);
  } else {
    // Remote repository
    return getConfigFilenameFromSnakefile_Remote(snakefile as Record<string, unknown>);
  }
}

const getConfigFilenameFromSnakefile_Local = (filepath: string): string | null => {
  const data = fs.readFileSync(filepath, 'utf8');
  const lines = data.split(/\r?\n/);
  const configLine = lines.find(line => line.startsWith('configfile:'));
  if (configLine) {
    const value = configLine.split('configfile: ')[1].trim().slice(1, -1);  // remove quotes
    return value;
  }
  return null;
}

const getConfigFilenameFromSnakefile_Remote = async(
  snakefile: Record<string, unknown>,
): Promise<string | null> => {
  // Remote repository
  snakefile = snakefile as Record<string, unknown>;
  const snakefile_rel =
    (snakefile.args as string[])[0] +
    '/' + getBranchOrCommit(snakefile) +
    '/' + (snakefile.kwargs as Record<string, string>)['path'];
  const snakefile_url = 'https://raw.githubusercontent.com/' + snakefile_rel;
  const data = await axios.get(snakefile_url).then(response => response.data);
  const lines = data.split(/\r?\n/);
  const configLine = lines.find((line: string) => line.startsWith('configfile:'));
  if (configLine) {
    const value = configLine.split('configfile: ')[1].trim().slice(1, -1);  // remove quotes
    return value;
  }
  return null;
}

const GetModuleConfigFilesList = async (
  snakefile: Record<string, unknown> | string,
) => {
  // Get list of available config.yaml files from config folder.
  // Should work got either local or remote repositories

  const configfile = getConfigFilenameFromSnakefile(snakefile);
  const configfiles_list: string[] = [];

  if (typeof snakefile === 'string') {
    // Local repository
    const workflow_url = snakefile as string;
    const configfile_relative = await getConfigFilenameFromSnakefile(workflow_url);
    if (configfile_relative) {
      const configfile = path.join(path.dirname(workflow_url), '..', configfile_relative);
      const configfile_path = path.dirname(configfile);
      const configfiles = fs.readdirSync(configfile_path);
      for (const file of configfiles) {
        if (file.endsWith('.yaml')) {
          configfiles_list.push(path.join(configfile_path, file));
        }
      }
    }
  } else {
    // Remote repository
    snakefile = snakefile as Record<string, unknown>;
    const workflow_path = (snakefile['kwargs'] as Record<string, string>)['path'];
    const configfile_rel = await getConfigFilenameFromSnakefile(snakefile);
    if (configfile_rel) {
      const repo = (snakefile['args'] as string[])[0];
      const branch = "main";
      const configfile_path = [
        url_github,
        repo,
        'contents',
        workflow_path.split('/').slice(0, -2).join('/'),
        configfile_rel.split('/').slice(0, -1).join('/'),
      ].join('/');
      const url_base = [
        url_github,
        (snakefile['args'] as string[])[0],
        'contents',
        'workflows',
      ].join('/');
      const configfiles = await api_get(configfile_path, url_base);
      const filepath = [
        'https://raw.githubusercontent.com',
        repo,
        branch,
        'workflows',
        configfile_path.replace(url_base, ''),
      ].join('/');
      for (const file of configfiles) {
        if (file['name'].endsWith('.yaml')) {
          configfiles_list.push([filepath, file['name']].join('/'));
        }
      }
    }
  }

  return configfiles_list;
};

export {
  GetLocalModules,
  GetModuleConfig,
  GetModuleConfigFile,
  GetModuleDocstring,
  GetModulesList,
  GetRemoteModulesGithubDirectoryListing,
  GetModuleConfigFilesList,
  getConfigFilenameFromSnakefile,
  ParseDocstring,
};
module.exports = {
  GetModuleConfig,
  GetModuleConfigFile,
  GetModuleDocstring,
  ParseDocstring,
  GetLocalModules,
  GetModulesList,
  GetModuleConfigFilesList,
  getConfigFilenameFromSnakefile,
  GetRemoteModulesGithubDirectoryListing,
};
export default module.exports;
