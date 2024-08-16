import * as fs from 'fs';
import * as path from 'path';
import { Build } from './newmodule';
import {
  INewModuleStateConfig,
  INewModuleStateConfigFile,
  INewModuleStateConfigInputFilesRow,
  INewModuleStateConfigOutputFilesRow,
} from './types';

test('Build', async () => {
  // Create a new module
  const test_folder = path.join('src', 'tests');
  const test_files_folder = path.join(test_folder, 'test_files');
  // Check that tests folder exists (contains test files)
  expect(fs.existsSync(test_folder)).toBe(true);
  // Create a test repo folder
  const repo_folder = path.join(test_folder, 'test-repo');
  if (fs.existsSync(repo_folder)) fs.rmSync(repo_folder, { recursive: true, force: true });
  const workflows_folder = path.join(repo_folder, 'workflows');
  fs.mkdirSync(workflows_folder, { recursive: true });
  expect(fs.existsSync(workflows_folder)).toBe(true);
  // New module configuration
  const moduleConfig: INewModuleStateConfig = {
    name: 'test_name',
    foldername: 'test_module',
    repo: repo_folder, // Destination folder for the new module
    project: 'test_project',
    docstring: 'test_docstring',
    ports: ['test_port1', 'test_port2'], // type: 'module' ('source' if no input ports)
    params: 'test_param: test_value',
    input_files: [
      {
        id: 0,
        port: 'test_port1',
        label: 'in1_label',
        filename: 'in1_filename',
      },
      {
        id: 0,
        port: 'test_port2',
        label: 'in2_label',
        filename: 'in2_filename',
      },
    ] as INewModuleStateConfigInputFilesRow[],
    output_files: [
      {
        id: 0,
        label: 'out_label',
        filename: 'out_filename',
      },
    ] as INewModuleStateConfigOutputFilesRow[],
    env: 'test_env',
    scripts: [
      {
        id: 'id0',
        label: 'script_label',
        filename: path.join(test_files_folder, 'test_script_file'), // Local file
        isfolder: false,
      },
    ] as INewModuleStateConfigFile[],
    resources: [
      {
        id: 'id0',
        label: 'resource_label',
        filename: path.join(test_files_folder, 'test_resource_file'), // Local file
        isfolder: false,
      },
    ] as INewModuleStateConfigFile[],
    command_directive: 'test_directive',
    command: 'test_command',
  };
  // New module build settings
  const moduleBuildSettings = {
    overwrite_existing_module_folder: true,
    as_zip: false,
  };
  // Create the new module
  await Build({ config: moduleConfig, build_settings: moduleBuildSettings });
  // Check that the module was created
  const module_type = moduleConfig.ports.length > 0 ? 'modules' : 'sources';
  const module_folder = path.join(
    workflows_folder,
    moduleConfig.project,
    module_type,
    moduleConfig.foldername,
  );
  expect(fs.existsSync(module_folder)).toBe(true);
  // Check that the module files were created and populated correctly
  const checkFile = (filename: string, expected_contents: string) => {
    expect(fs.existsSync(filename)).toBe(true);
    const contents = fs.readFileSync(filename, 'utf8');
    expect(contents.trim()).toBe(expected_contents.trim());
  };
  checkFile(
    path.join(module_folder, 'config', 'config.yaml'),
    `input_namespace:
  test_port1: test_port1
  test_port2: test_port2
output_namespace: out
params:
  test_param: test_value
`,
  );
  checkFile(
    path.join(module_folder, 'resources', 'test_resource_file'),
    `test_resource_file_contents`,
  );
  checkFile(
    path.join(module_folder, 'workflow', 'Snakefile'),
    fs.readFileSync(path.join(test_files_folder, 'target_snakefile'), 'utf8'),
  );
  checkFile(path.join(module_folder, 'workflow', 'envs', 'env.yaml'), `test_env`);
  checkFile(
    path.join(module_folder, 'workflow', 'scripts', 'test_script_file'),
    `test_script_file_contents`,
  );
  // Remove the new module
  fs.rmSync(repo_folder, { recursive: true, force: true });
});

test('CondaSearch', async () => {
  //await CondaSearch({} as Event, {} as Query);
});
