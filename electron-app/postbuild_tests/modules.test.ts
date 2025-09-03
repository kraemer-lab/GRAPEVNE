import { By, until } from 'selenium-webdriver';

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as webdriver from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

import {
  BuildAndRun_MultiModuleWorkflow,
  BuildAndRun_SingleModuleWorkflow,
  Build_RunWithDocker_SingleModuleWorkflow,
  ClearGraph,
  DragAndDrop,
  FlushConsoleLog,
  InputFilelistAddItem,
  MultiModuleWorkflow_BuildAndCheck,
  MultiModuleWorkflow_CleanAndDetermineTargets,
  MultiModuleWorkflow_Setup,
  MultiModuleWorkflow_TidyUp,
  OutputFilelistAddItem,
  OverwriteInputField,
  RedirectConsoleLog,
  RepoListAddItem,
  SetCheckBoxByID,
  WaitForReturnCode,
  is_installed,
  is_windows,
  runif,
} from './utils';

const ONE_SEC = 1000;
const TEN_SECS = 10 * ONE_SEC;
const ONE_MINUTE = 60 * ONE_SEC;

let run_container_tests = true;
process.argv.slice(2).forEach((arg) => {
  console.log(`::: ${arg}`);
  if (arg === '--no-containers') {
    console.log('Skipping container tests');
    run_container_tests = false;
  }
});

/*
 * Note: These tests chain together, so they must be run in order.
 */
describe('modules', () => {
  let driver: webdriver.ThenableWebDriver;
  let opts = { async: undefined, bridge: undefined }; // driver.actions() options
  jest.retryTimes(3);

  beforeAll(async () => {
    console.log('::: beforeAll');

    // Start webdriver
    const options = new chrome.Options();
    options.debuggerAddress('localhost:9515');
    driver = new webdriver.Builder().forBrowser('chrome', '138').setChromeOptions(options).build();
    console.log('Webdriver started.');

    await RedirectConsoleLog(driver);
    console.log('<<< beforeAll');
  }, ONE_MINUTE);

  afterAll(async () => {
    console.log('::: afterAll');
    await driver.close();
    await driver.quit();
    console.log('<<< afterAll');
  });

  beforeEach(async () => {
    console.log('::: beforeEach');
    // Flush message logs prior to next test
    await FlushConsoleLog(driver);
    // Reset GUI as best possible before next test
    for (let k = 0; k < 5; k++) {
      await driver.switchTo().activeElement().sendKeys(webdriver.Key.ESCAPE);
      await driver.sleep(50);
    }
    // Always start on the Builder screen
    await driver.findElement(By.xpath('//div[@id="btnSidenavBuilder"]')).click();
    console.log('<<< beforeEach');
  });

  test('webdriver connected to GRAPEVNE', async () => {
    console.log('::: test webdriver connected to GRAPEVNE');
    expect(driver).not.toBeNull();
    expect(await driver.getTitle()).toBe('GRAPEVNE');
    console.log('<<< test webdriver connected to GRAPEVNE');
  });

  test(
    'Select test repository',
    async () => {
      console.log('::: test Select test repository');
      // Open settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavSettings"]')).click();

      // Select each item in the repositories list and click Remove
      let repo_list = await driver.findElements(By.xpath('//div[@data-rowindex]'));
      const btnRemove = await driver.findElement(
        By.id('buttonBuilderSettingsRepositoryListRemoveItem'),
      );
      for (let i = 0; i < repo_list.length; i++) {
        await repo_list[i].click();
        await btnRemove.click();
      }
      repo_list = await driver.findElements(By.xpath('//div[@data-rowindex]'));
      expect(repo_list.length).toEqual(0); // ensure all items removed

      // Add test repository to list
      const btnAdd = await driver.findElement(By.id('buttonBuilderSettingsRepositoryListAddItem'));
      await RepoListAddItem({
        driver: driver,
        label: 'test-repo',
        type: 'local',
        url: path.join(__dirname, 'test-repo'),
      });

      // Ensure that interface options are set as expected
      await SetCheckBoxByID(driver, 'display_module_settings', false);
      await SetCheckBoxByID(driver, 'hide_params_in_module_info', true);
      await SetCheckBoxByID(driver, 'auto_validate_connections', false);

      // Close settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavBuilder"]')).click();
      console.log('<<< test Select test repository');
    },
    ONE_MINUTE,
  );

  test('Get local modules list', async () => {
    console.log('::: test Get local modules list');
    // Get modules list
    await driver.findElement(By.id('btnBuilderGetModuleList')).click();
    const msg = await WaitForReturnCode(driver, 'builder/get-remote-modules');
    expect(msg.returncode).toEqual(0);
    // Wait for module list to be populated
    await driver.wait(until.elementLocated(By.id('modulelist-payload_shell')), TEN_SECS);
    console.log('<<< test Get local modules list');
  });

  test(
    'Expand multi-nodes (with input and output connections)',
    async () => {
      console.log('::: test Expand multi-nodes (with input and output connections)');

      // Drag-and-drop the same hierarchical modules into the scene three times
      await ClearGraph(driver);
      const module = await driver.findElement(By.id('modulelist-copy_run3'));
      const canvas = await driver.findElement(By.className('react-flow__pane'));
      for (const n of ['n0', 'n1', 'n2']) {
        console.log(`Dragging module to canvas: ${n}`);
        await driver.actions(opts).dragAndDrop(module, canvas).perform();
        await driver.wait(until.elementLocated(By.xpath(`//div[@data-id="${n}"]`)));
      }
      await driver.findElement(By.id('buttonReactflowArrange')).click();

      // Connect the modules together
      await driver
        .actions(opts)
        .dragAndDrop(
          await driver.findElement(By.xpath('//div[@data-id="n0-out-source"]')),
          await driver.findElement(
            By.xpath('//div[@data-id="n1-single_modules_copy_run$-target"]'),
          ),
        )
        .perform(); // n0-to-n1
      await driver
        .actions(opts)
        .dragAndDrop(
          await driver.findElement(By.xpath('//div[@data-id="n1-out-source"]')),
          await driver.findElement(
            By.xpath('//div[@data-id="n2-single_modules_copy_run$-target"]'),
          ),
        )
        .perform(); // n1-to-n2

      // Check connections before expansion
      let conns = [
        ['n0', 'n1'],
        ['n1', 'n2'],
      ];
      for await (const [nodefrom, nodeto] of conns) {
        await driver.wait(
          until.elementLocated(
            By.xpath(`//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`),
          ),
        );
      }
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(`//*[@aria-label and contains(@class, "react-flow__edge")]`),
          )
        ).length,
      ).toEqual(conns.length);

      // Expand the centre module and check connections
      conns = [
        ['n0', 'n3'],
        ['n3', 'n4'],
        ['n4', 'n5'],
        ['n5', 'n2'],
      ];
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderExpand')));
      await driver.findElement(By.id('btnBuilderExpand')).click();
      for await (const [nodefrom, nodeto] of conns) {
        await driver.wait(
          until.elementLocated(
            By.xpath(`//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`),
          ),
        );
      }
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(`//*[@aria-label and contains(@class, "react-flow__edge")]`),
          )
        ).length,
      ).toEqual(conns.length);

      // Next, expand the leading module and check connections
      conns = [
        ['n1', 'n6'],
        ['n6', 'n7'],
        ['n7', 'n3'],
        ['n3', 'n4'],
        ['n4', 'n5'],
        ['n5', 'n2'],
      ];
      await driver.findElement(By.xpath(`//div[@data-id="n0"]`)).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderExpand')));
      await driver.findElement(By.id('btnBuilderExpand')).click();
      for await (const [nodefrom, nodeto] of conns) {
        await driver.wait(
          until.elementLocated(
            By.xpath(`//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`),
          ),
        );
      }
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(`//*[@aria-label and contains(@class, "react-flow__edge")]`),
          )
        ).length,
      ).toEqual(conns.length);

      // Finally, expand the trailing module and check connections
      conns = [
        ['n1', 'n6'],
        ['n6', 'n7'],
        ['n7', 'n3'],
        ['n3', 'n4'],
        ['n4', 'n5'],
        ['n5', 'n0'],
        ['n0', 'n8'],
        ['n8', 'n9'],
      ];
      await driver.findElement(By.xpath(`//div[@data-id="n2"]`)).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderExpand')));
      await driver.findElement(By.id('btnBuilderExpand')).click();
      for await (const [nodefrom, nodeto] of conns) {
        await driver.wait(
          until.elementLocated(
            By.xpath(`//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`),
          ),
        );
      }
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(`//*[@aria-label and contains(@class, "react-flow__edge")]`),
          )
        ).length,
      ).toEqual(conns.length);

      console.log('<<< test Expand multi-nodes (with input and output connections)');
    },
    5 * ONE_MINUTE,
  );

  runif(!is_windows)(
    'Module validation (dependency checks)',
    async () => {
      console.log('::: test Module validation (dependency checks)');

      // Drag-and-drop a source and copy module into the scene
      await ClearGraph(driver);
      const canvas = await driver.findElement(By.className('react-flow__pane'));
      await DragAndDrop(driver, driver.findElement(By.id(`modulelist-payload_run`)), canvas);
      await driver.wait(until.elementLocated(By.xpath(`//div[@data-id="n0"]`)));
      await DragAndDrop(driver, driver.findElement(By.id(`modulelist-copy_run`)), canvas);
      await driver.wait(until.elementLocated(By.xpath(`//div[@data-id="n1"]`)));
      await driver.findElement(By.id('buttonReactflowArrange')).click();

      // Connect the modules together
      await driver
        .actions(opts)
        .dragAndDrop(
          driver.findElement(By.xpath('//div[@data-id="n0-out-source"]')),
          driver.findElement(By.xpath('//div[@data-id="n1-in-target"]')),
        )
        .perform(); // n1-to-n2

      // Select target module and click 'Validate'
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderValidate')));
      await driver.findElement(By.id('btnBuilderValidate')).click();
      let msg = await WaitForReturnCode(driver, 'runner/check-node-dependencies');
      expect(msg.returncode).toEqual(0); // 0 = success

      // Change the expected file name in the source module
      await driver.findElement(By.xpath(`//div[@data-id="n0"]`)).click();
      await driver.sleep(50); // Wait for module settings to expand
      await OverwriteInputField(
        await driver.findElement(webdriver.By.id('nodeinfo-n0-config-params-filename')),
        'mismatch',
      );

      // Select target module and click 'Validate'
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderValidate')));
      await driver.findElement(By.id('btnBuilderValidate')).click();
      msg = await WaitForReturnCode(driver, 'runner/check-node-dependencies');
      expect(msg.returncode).toEqual(1); // 1 = missing dependency

      console.log('<<< test Expand multi-nodes (with input and output connections)');
    },
    5 * ONE_MINUTE,
  );

  test('Construct single module workflow in GRAPEVNE', async () => {
    console.log('::: test Construct single module workflow in GRAPEVNE');

    // Drag-and-drop module from modules-list into scene
    await ClearGraph(driver);
    const module = await driver.findElement(By.id('modulelist-payload_shell'));
    const canvas = await driver.findElement(By.className('react-flow__pane'));
    await DragAndDrop(driver, module, canvas);
    await driver.wait(until.elementLocated(By.xpath(`//div[@data-id="n0"]`)));

    // Wait for module to be added to the scene and for the config to load
    console.log('<<< test Construct single module workflow in GRAPEVNE');
  });

  runif(!is_windows).each([
    ['payload shell', [path.join('results', 'payload_shell', 'data.csv')]],
    ['payload run', [path.join('results', 'payload_run', 'data.csv')]],
  ])(
    "Build and Test the workflow: module '%s'",
    async (modulename, outfiles) => {
      // Open settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavSettings"]')).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(webdriver.By.id('inputBuilderSettingsSnakemakeArgs'));
      await OverwriteInputField(args, '--cores 1');

      // Close settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavBuilder"]')).click();

      // Build and run workflow
      await BuildAndRun_SingleModuleWorkflow(driver, modulename, outfiles);
    },
    5 * ONE_MINUTE,
  ); // long timeout

  runif(!is_windows).each([
    // Test: 1 (connect two modules)
    [
      [
        // Modules to add to scene
        'payload shell', // data-nodeid="n0"
        'copy run', // data-nodeid="n1"
      ],
      [
        // Connections to make between modules
        ['n0-out-source', 'n1-in-target'], // (nodeid)-(portname)-(porttype)
      ],
      [
        // Expected output files
        path.join('results', 'copy_run', 'data.csv'),
      ],
    ],
    // Test: 2 (connect five modules, including 4 duplicates)
    [
      [
        // Modules to add to scene
        'payload shell', // data-nodeid="n0"
        'copy run', // data-nodeid="n1"
        'copy run', // data-nodeid="n2"
        'copy run', // data-nodeid="n3"
        'copy run', // data-nodeid="n4"
      ],
      [
        // Connections to make between modules
        ['n0-out-source', 'n1-in-target'], // (nodeid)-(portname)-(porttype)
        ['n1-out-source', 'n2-in-target'],
        ['n2-out-source', 'n3-in-target'],
        ['n3-out-source', 'n4-in-target'],
      ],
      [
        // Expected output files
        path.join('results', 'copy_run_3', 'data.csv'),
      ],
    ],
    // Test: 3 (connect source to triple input module)
    [
      [
        // Modules to add to scene
        'payload shell', // data-nodeid="n0"
        'copy run multiport', // data-nodeid="n1"
      ],
      [
        // Connections to make between modules
        ['n0-out-source', 'n1-in1-target'], // (nodeid)-(portname)-(porttype)
      ],
      [
        // Expected output files
        path.join('results', 'copy_run_multiport', 'data.csv'),
      ],
    ],
  ])(
    "Build and Test the workflow: module '%s'",
    async (modulenames, connections, outfiles) => {
      // Open settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavSettings"]')).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(webdriver.By.id('inputBuilderSettingsSnakemakeArgs'));
      await OverwriteInputField(args, '--cores 1');

      // Close settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavBuilder"]')).click();
      console.log('<<< test Set snakemake arguments list to use conda');

      // Build and run workflow
      await BuildAndRun_MultiModuleWorkflow(driver, modulenames, connections, outfiles);
    },
    5 * ONE_MINUTE,
  ); // long timeout

  test.each([
    [
      [
        // Modules to add to scene
        'payload run', // data-nodeid="n0"
        'copy run', // data-nodeid="n1"
      ],
      [
        // Connections to make between modules
        ['n0-out-source', 'n1-in-target'], // (nodeid)-(portname)-(porttype)
      ],
      [
        // Expected output files
        path.join('results', 'copy_run', 'data.csv'),
      ],
    ],
  ])(
    'Parameter linkage',
    async (modulenames, connections, outfiles) => {
      // Drag modules into scene; connect and run with default settings
      await MultiModuleWorkflow_Setup(driver, modulenames, connections);
      let target_files = await MultiModuleWorkflow_CleanAndDetermineTargets(
        driver,
        modulenames,
        connections,
        outfiles,
      );

      // Validation check (should pass)
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderValidate')));
      await driver.findElement(By.id('btnBuilderValidate')).click();
      let msg = await WaitForReturnCode(driver, 'runner/check-node-dependencies');
      expect(msg.returncode).toEqual(0); // 0 = success
      await driver.findElement(By.className('react-flow__pane')).click();

      // Build and run the workflow (should pass)
      await MultiModuleWorkflow_BuildAndCheck({
        driver: driver,
        target_files: target_files,
      });
      await MultiModuleWorkflow_TidyUp(driver, target_files);

      // Change the source filename (not yet linked to target module)
      await driver.findElement(By.xpath(`//div[@data-id="n0"]`)).click();
      await OverwriteInputField(
        await driver.findElement(webdriver.By.id('nodeinfo-n0-config-params-filename')),
        'newfile.csv',
      );

      // Validation check (should fail)
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderValidate')));
      await driver.findElement(By.id('btnBuilderValidate')).click();
      msg = await WaitForReturnCode(driver, 'runner/check-node-dependencies');
      expect(msg.returncode).toEqual(1); // 1 = missing dependency

      // Build should fail
      console.log("Build should fail (source filename not linked to target module's input)");
      await MultiModuleWorkflow_BuildAndCheck({
        driver: driver,
        target_files: target_files,
        should_fail: true,
      });
      await MultiModuleWorkflow_TidyUp(driver, target_files);
      await driver.findElement(By.className('react-flow__pane')).click();

      // Form parameter link between modules
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      const link_button = By.id('nodeinfo-n1-config-params-filename_link');
      await driver.wait(until.elementLocated(link_button), TEN_SECS);
      await driver.findElement(link_button).click();
      const link_target = By.xpath(
        `//div[contains(@class, 'MuiTreeItem-label') and contains(text(), "filename")]`,
      );
      await driver.wait(until.elementLocated(link_target), TEN_SECS);
      await driver.findElement(link_target).click();
      await driver.findElement(By.id('btnParameterListClose')).click();
      await driver.findElement(By.className('react-flow__pane')).click();

      // Validation check (should pass)
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderValidate')));
      await driver.findElement(By.id('btnBuilderValidate')).click();
      msg = await WaitForReturnCode(driver, 'runner/check-node-dependencies');
      expect(msg.returncode).toEqual(0); // 0 = success

      // Build and run the (linked) workflow (should pass)
      outfiles[0] = path.join('results', 'copy_run', 'newfile.csv');
      target_files = await MultiModuleWorkflow_CleanAndDetermineTargets(
        driver,
        modulenames,
        connections,
        outfiles,
      );
      await MultiModuleWorkflow_BuildAndCheck({
        driver: driver,
        target_files: target_files,
      });
      await MultiModuleWorkflow_TidyUp(driver, target_files);
      await driver.findElement(By.className('react-flow__pane')).click();

      // Delete the parameter link between modules
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(link_button), TEN_SECS);
      await driver.findElement(link_button).click();
      await driver.wait(until.elementLocated(By.id('btnParameterListRemove')), TEN_SECS);
      await driver.findElement(By.id('btnParameterListRemove')).click();
      await driver.findElement(By.id('btnParameterListClose')).click();

      // Validation check (should fail - no need to test build again)
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderValidate')));
      await driver.findElement(By.id('btnBuilderValidate')).click();
      msg = await WaitForReturnCode(driver, 'runner/check-node-dependencies');
      expect(msg.returncode).toEqual(1); // 1 = missing dependency
    },
    5 * ONE_MINUTE,
  );

  runif(is_installed(['mamba', 'conda'], 'any'))(
    'Set snakemake arguments list to use conda',
    async () => {
      console.log('::: test Set snakemake arguments list to use conda');
      // Open settings panel
      await driver.findElement(By.xpath('//div[@id="btnSidenavSettings"]')).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(webdriver.By.id('inputBuilderSettingsSnakemakeArgs'));
      await OverwriteInputField(args, '--cores 1 --use-conda');

      // Set conda environment path --- passthrough from test environment
      if (process.env.CONDA_PATH != undefined) {
        const args = await driver.findElement(
          webdriver.By.id('inputBuilderSettingsEnvironmentVars'),
        );
        await OverwriteInputField(args, `PATH=${process.env.CONDA_PATH}`);
      }

      // Close settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavBuilder"]')).click();
      console.log('<<< test Set snakemake arguments list to use conda');
    },
  );

  // Conda tests
  runif(!is_windows && is_installed(['mamba', 'conda'], 'any')).each([
    // Test: 1 (connect two modules)
    [
      [
        // Modules to add to scene
        'payload run', // data-nodeid="n0"
        'conda', // data-nodeid="n1"
      ],
      [
        // Connections to make between modules
        ['n0-out-source', 'n1-in-target'], // (nodeid)-(portname)-(porttype)
      ],
      [
        // Expected output files
        path.join('results', 'conda', 'data.csv'),
      ],
    ],
  ])(
    "Build and Test the conda workflow: module '%s'",
    async (modulenames, connections, outfiles) => {
      console.log('::: test Build and Test the conda workflow');

      // Open settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavSettings"]')).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(webdriver.By.id('inputBuilderSettingsSnakemakeArgs'));
      await OverwriteInputField(args, '--cores 1 --use-conda');

      // Close settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavBuilder"]')).click();
      console.log('<<< test Set snakemake arguments list to use conda');

      // Build and run workflow
      await BuildAndRun_MultiModuleWorkflow(driver, modulenames, connections, outfiles);
      console.log('<<< test Build and Test the conda workflow');
    },
    5 * ONE_MINUTE,
  ); // long timeout

  test(
    'Create a new module (no payload)',
    async () => {
      console.log('::: test Create a new module (no payload)');

      // Ensure target module folder does not exist (and delete if it does)
      console.log('Ensure target module folder does not exit');
      const target_folder = path.join(
        __dirname,
        'test-repo',
        'workflows',
        'single_modules',
        'modules',
        'NewModule',
      );
      console.log(`Target folder: ${target_folder}`);
      if (fs.existsSync(target_folder)) {
        console.log('Target folder exists; deleting');
        fs.rmSync(target_folder, { recursive: true, force: true });
      }
      expect(fs.existsSync(target_folder)).toBeFalsy();
      console.log('Target folder does not exist');

      // Side navbar to Module Editor page
      await driver.wait(until.elementLocated(By.id('btnSidenavModuleEditor'))).click();

      // Set module name
      await OverwriteInputField(
        driver.findElement(By.id('module-name')),
        'New Module', // space will be removed from folder name
      );

      // Select the module repository (choose the local test-repo)
      const repo_type = await driver.wait(until.elementLocated(By.id('module-repo')));
      await repo_type.click();
      await repo_type
        .findElement(
          By.xpath(
            '//li[substring(@data-value, string-length(@data-value) - string-length("test-repo") + 1) = "test-repo"]',
          ),
        )
        .click(); // li with data-value ending in "test-repo"

      // Select project (within repo)
      const project = await driver.findElement(By.id('module-project'));
      await project.click();
      await project.findElement(By.xpath('//li[@data-value="single_modules"]')).click();

      // Enter module description
      await OverwriteInputField(
        driver.findElement(By.id('module-docstring')),
        'Short summary of new module\n\n' +
          'Longer description of new module\n\n' +
          'Parameters are specified here',
      );

      // Remove any existing input ports
      const existing_ports = await driver.findElements(
        By.xpath('//div[@id="newmodule-ports-container"]//*[local-name()="svg"]'),
      );
      for (const port of existing_ports) {
        await port.click();
      }
      // Verify that the ports have been removed
      expect(
        (
          await driver.findElements(
            By.xpath('//div[@id="newmodule-ports-container"]//*[local-name()="svg"]'),
          )
        ).length,
      ).toEqual(0);

      // Add new input ports
      await OverwriteInputField(driver.findElement(By.id('module-ports')), 'in1');
      await OverwriteInputField(driver.findElement(By.id('module-ports')), 'in2');
      await OverwriteInputField(driver.findElement(By.id('module-ports')), 'in3');
      // Verify that the new ports are present
      expect(
        (
          await driver.findElements(
            By.xpath('//div[@id="newmodule-ports-container"]//*[local-name()="svg"]'),
          )
        ).length,
      ).toEqual(3);

      // Set the module parameters
      const params =
        'testparam: testvalue\n' + 'nested: {\n' + '  nestedparam: nestedvalue\n' + '}';
      await OverwriteInputField(driver.findElement(By.id('module-params')), params);

      // Add input file
      await InputFilelistAddItem({
        driver: driver,
        label: 'infile',
        port: 'in1',
        filename: 'infile.txt',
      });
      // Select the new row
      const target_cell = '//div[contains(@class, "MuiDataGrid-cell") and @title="infile"]';
      await driver.wait(until.elementLocated(By.xpath(target_cell)), 5 * ONE_SEC);
      await driver.findElement(By.xpath(target_cell)).click();

      // Remove input file (not required for this module)
      for (let k = 0; k < 5; k++) {
        try {
          await driver.findElement(By.id('btnInputFilesRemove')).click();
          break;
        } catch (e) {
          await driver.sleep(100);
          continue;
        }
      }

      // Add output files
      await OutputFilelistAddItem({
        driver: driver,
        label: 'outfile',
        filename: 'outfile.txt',
      });

      // Specify command directive
      const cmd_type = await driver.findElement(By.id('module-script-select'));
      await cmd_type.click();
      await cmd_type.findElement(By.xpath('//li[@data-value="shell"]')).click();

      // Specify command
      await OverwriteInputField(
        driver.findElement(By.id('module-script')),
        "echo 'Hello, world!' > {output.outfile}",
      );

      // Specify environment (conda configuration)
      await OverwriteInputField(
        driver.findElement(By.id('module-environment')),
        'name: test-env\n' + 'channels:\n' + '  - conda-forge\n',
      );

      // Add script files here --- none to add

      // Add resource files here --- none to add

      // Build the module
      await driver.findElement(By.id('btnNewModuleBuild')).click();
      // Wait for module to build, and check return code
      let msg = await WaitForReturnCode(driver, 'newmodule/build');
      expect(msg.returncode).toEqual(0);

      // Verify that the module has been created properly
      console.log('Verify that the module has been created properly');
      console.log(`Target folder: ${target_folder}`);
      expect(fs.existsSync(target_folder)).toBeTruthy();
      const snakefile = path.join(target_folder, 'workflow', 'Snakefile');
      expect(fs.existsSync(snakefile)).toBeTruthy();
      const configfile = path.join(target_folder, 'config', 'config.yaml');
      expect(fs.existsSync(configfile)).toBeTruthy();
      const config = yaml.load(fs.readFileSync(configfile, 'utf8'));
      expect(yaml.dump(config)).toEqual(
        yaml.dump({
          ports: [
            {
              ref: 'in1',
              label: 'in1',
              namespace: 'in1',
            },
            {
              ref: 'in2',
              label: 'in2',
              namespace: 'in2',
            },
            {
              ref: 'in3',
              label: 'in3',
              namespace: 'in3',
            },
          ],
          namespace: 'out',
          params: {
            testparam: 'testvalue',
            nested: {
              nestedparam: 'nestedvalue',
            },
          },
        }),
      );
      const envfile = path.join(target_folder, 'workflow', 'envs', 'env.yaml');
      expect(fs.existsSync(envfile)).toBeTruthy();
      const env = yaml.load(fs.readFileSync(envfile, 'utf8'));
      expect(yaml.dump(env)).toEqual(
        yaml.dump({
          name: 'test-env',
          channels: ['conda-forge'],
        }),
      );

      // Run the new module
      await driver.wait(until.elementLocated(By.id('btnSidenavBuilder'))).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderGetModuleList'))).click();
      await ClearGraph(driver);
      const module = await driver.wait(until.elementLocated(By.id('modulelist-newmodule')));
      const canvas = await driver.wait(until.elementLocated(By.className('react-flow__pane')));
      await DragAndDrop(driver, module, canvas);
      await driver.wait(until.elementLocated(By.xpath(`//div[@data-id="n0"]`)));
      await driver.wait(until.elementLocated(By.id('btnBuildAndRunDropdown'))).click();
      await driver.wait(until.elementLocated(By.id('btnBuilderBuildAndTest'))).click();
      msg = await WaitForReturnCode(driver, 'builder/build-and-run');
      expect(msg.returncode).toEqual(0);

      // Tidy-up (remove module from repository)
      console.log('Tidy-up (remove module from repository)');
      fs.rmSync(target_folder, { recursive: true, force: true });

      console.log('<<< test Create a new module (new module screen)');
    },
    5 * ONE_MINUTE,
  );

  test(
    'Build module to zip file',
    async () => {
      console.log('::: test Build module to zip file');
      await ClearGraph(driver);

      // Assert that build file does not exist
      const buildfile = path.join(__dirname, 'downloads', 'build.zip');
      if (fs.existsSync(buildfile)) fs.unlinkSync(buildfile);
      expect(fs.existsSync(buildfile)).toBeFalsy();

      // Create a simple one module workflow
      const module = await driver.findElement(By.id('modulelist-payload_run'));
      const canvas = await driver.findElement(By.className('react-flow__pane'));
      await DragAndDrop(driver, module, canvas);

      // 'Build & Run' - 'Build Module' - 'Zip file'
      const btnBuild = await driver.findElement(By.id('btnBuildAndRunDropdown'));
      await btnBuild.click();
      const btnBuildModule = btnBuild.findElement(By.xpath('//li[text()="MODULE FROM WORKFLOW"]'));
      await btnBuildModule.click();
      const btnZipFile = await driver.findElement(By.xpath('//li[text()="Zip file"]'));
      await btnZipFile.click();

      // Wait for build file to be downloaded
      console.log('Wait for build file to be downloaded');
      console.log('Build file: ', buildfile);
      while (!fs.existsSync(buildfile)) {
        await driver.sleep(500); // test will timeout if this fails repeatedly
      }
      expect(fs.existsSync(buildfile)).toBeTruthy();

      console.log('<<< test Build module to zip file');
    },
    ONE_MINUTE,
  );

  test(
    'Prepare: Ensure new module are not present in repository',
    async () => {
      console.log('::: test Prepare: Ensure new module are not present in repository');

      // Remove new module from repository
      const folder = path.join(__dirname, 'test-repo', 'workflows', 'MyNewProject');
      fs.rmSync(folder, { recursive: true, force: true });
      expect(fs.existsSync(folder)).toBeFalsy();

      // Refresh the modules list to ensure that the project / modules are removed
      await driver.findElement(By.id('btnBuilderGetModuleList')).click();

      console.log('<<< test Prepare: Ensure new module are not present in repository');
    },
    ONE_MINUTE,
  );

  test(
    'Build module to local repository (new project, new module)',
    async () => {
      console.log('::: test Build module to local repository (new project, new module)');
      await ClearGraph(driver);

      // Create a simple one module workflow
      const module = await driver.findElement(By.id('modulelist-payload_run'));
      const canvas = await driver.findElement(By.className('react-flow__pane'));
      await DragAndDrop(driver, module, canvas);
      // 'Build & Run' - 'Build Module' - 'test-repo' - 'New Project'
      const menuBuild = await driver.findElement(By.id('btnBuildAndRunDropdown'));
      await menuBuild.click();
      const menuBuildModule = menuBuild.findElement(
        By.xpath('//li[text()="MODULE FROM WORKFLOW"]'),
      );
      await menuBuildModule.click();
      let menuTestRepo = await menuBuildModule.findElement(By.xpath('//li[text()="test-repo"]'));
      await menuTestRepo.click();
      const btnNewProject = await menuTestRepo.findElement(By.xpath('//li[text()="New project"]'));
      await btnNewProject.click();
      // New Project dialog: 'My New Project'
      const inputProjectName = await driver.findElement(
        By.xpath("//h2[text()='New project']/following::div[1]//input"),
      );
      await OverwriteInputField(inputProjectName, 'My New Project');
      await driver.findElement(By.xpath('//button[text()="Confirm"]')).click();
      // 'test-repo' - 'My New Project' - 'New Module'
      menuTestRepo = await menuBuildModule.findElement(By.xpath('//li[text()="test-repo"]'));
      await menuTestRepo.click();
      const menuProjectFolder = await menuTestRepo.findElement(
        By.xpath('//li[text()="MyNewProject"]'),
      );
      await menuProjectFolder.click();
      const btnNewModule = await menuProjectFolder.findElement(
        By.xpath('//li[text()="New module"]'),
      );
      await btnNewModule.click();
      // New Module dialog: 'My New Module'
      const inputModuleName = await driver.findElement(
        By.xpath("//h2[text()='New module']/following::div[1]//input"),
      );
      await OverwriteInputField(inputModuleName, 'My New Module');
      await driver.findElement(By.xpath('//button[text()="Confirm"]')).click();
      // Wait for module to build, and check return code
      let msg = await WaitForReturnCode(driver, 'builder/build-as-module');
      expect(msg.returncode).toEqual(0);
      // Check for new module in modules list
      while (true) {
        console.log('Checking for new module in modules list');
        const modulelist = await driver.findElement(By.id('modulelist-mynewmodule'));
        if (modulelist) break;
        await driver.sleep(100);
      }

      console.log('<<< test Build module to local repository (new project, new module)');
    },
    ONE_MINUTE,
  );

  test(
    'Build module to local repository (existing project, new module)',
    async () => {
      console.log('::: test Build module to local repository (existing project, new module)');
      await ClearGraph(driver);

      // Create a simple one module workflow
      const module = await driver.findElement(By.id('modulelist-payload_run'));
      const canvas = await driver.findElement(By.className('react-flow__pane'));
      await DragAndDrop(driver, module, canvas);
      // 'Build & Run' - 'Build Module' - 'test-repo' - 'New Project'
      const menuBuild = await driver.findElement(By.id('btnBuildAndRunDropdown'));
      await menuBuild.click();
      const menuBuildModule = menuBuild.findElement(
        By.xpath('//li[text()="MODULE FROM WORKFLOW"]'),
      );
      await menuBuildModule.click();
      let menuTestRepo = await menuBuildModule.findElement(By.xpath('//li[text()="test-repo"]'));
      await menuTestRepo.click();
      // 'My New Project' - 'New Module'
      const menuProjectFolder = await menuTestRepo.findElement(
        By.xpath('//li[text()="MyNewProject"]'),
      );
      await menuProjectFolder.click();
      const btnNewModule = await menuProjectFolder.findElement(
        By.xpath('//li[text()="New module"]'),
      );
      await btnNewModule.click();
      // New Module dialog: 'My New Module'
      const inputModuleName = await driver.findElement(
        By.xpath("//h2[text()='New module']/following::div[1]//input"),
      );
      await OverwriteInputField(inputModuleName, 'My New Module 2');
      await driver.findElement(By.xpath('//button[text()="Confirm"]')).click();
      // Wait for module to build, and check return code
      let msg = await WaitForReturnCode(driver, 'builder/build-as-module');
      expect(msg.returncode).toEqual(0);
      // Check for new module in modules list
      while (true) {
        console.log('Checking for new module in modules list');
        const modulelist = await driver.findElement(By.id('modulelist-mynewmodule2'));
        if (modulelist) break;
        await driver.sleep(100);
      }

      console.log('<<< test Build module to local repository (existing project, new module)');
    },
    ONE_MINUTE,
  );

  test(
    'Build module to local repository (existing project, existing module [reject])',
    async () => {
      console.log(
        '::: test Build module to local repository (existing project, existing module [alert])',
      );
      await ClearGraph(driver);

      // Create a simple one module workflow
      const module = await driver.findElement(By.id('modulelist-payload_run'));
      const canvas = await driver.findElement(By.className('react-flow__pane'));
      await DragAndDrop(driver, module, canvas);
      // 'Build & Run' - 'Build Module' - 'test-repo' - 'New Project'
      const menuBuild = await driver.findElement(By.id('btnBuildAndRunDropdown'));
      await menuBuild.click();
      const menuBuildModule = menuBuild.findElement(
        By.xpath('//li[text()="MODULE FROM WORKFLOW"]'),
      );
      await menuBuildModule.click();
      let menuTestRepo = await menuBuildModule.findElement(By.xpath('//li[text()="test-repo"]'));
      await menuTestRepo.click();
      const btnNewProject = await menuTestRepo.findElement(By.xpath('//li[text()="New project"]'));
      await btnNewProject.click();
      // New Project dialog: 'My New Project' (existing project, should alert user)
      const inputProjectName = await driver.findElement(
        By.xpath("//h2[text()='New project']/following::div[1]//input"),
      );
      await OverwriteInputField(inputProjectName, 'My New Project');
      await driver.findElement(By.xpath('//button[text()="Confirm"]')).click();
      // Should reject as module already exists - check for alert
      const projectAlert = await driver.wait(
        until.elementLocated(By.xpath('//h2[text()="Project already exists"]')),
      );
      await driver.findElement(By.xpath('//button[text()="CLOSE"]')).click();
      // 'test-repo' - 'My New Project' - 'New Module'
      menuTestRepo = await menuBuildModule.findElement(By.xpath('//li[text()="test-repo"]'));
      await menuTestRepo.click();
      const menuProjectFolder = await menuTestRepo.findElement(
        By.xpath('//li[text()="MyNewProject"]'),
      );
      await menuProjectFolder.click();
      const btnNewModule = await menuProjectFolder.findElement(
        By.xpath('//li[text()="New module"]'),
      );
      await btnNewModule.click();
      // New Module dialog: 'My New Module'
      const inputModuleName = await driver.findElement(
        By.xpath("//h2[text()='New module']/following::div[1]//input"),
      );
      await OverwriteInputField(inputModuleName, 'My New Module 2');
      await driver.findElement(By.xpath('//button[text()="Confirm"]')).click();
      // Should reject as module already exists - check for alert
      const msgAlert = await driver.wait(
        until.elementLocated(By.xpath('//h2[text()="Module already exists"]')),
      );
      await driver.findElement(By.xpath('//button[text()="CLOSE"]')).click();

      console.log(
        '<<< test Build module to local repository (existing project, existing module [alert])',
      );
    },
    ONE_MINUTE,
  );

  test(
    'Build module to local repository (existing project, existing module [overwrite])',
    async () => {
      console.log(
        '::: test Build module to local repository (existing project, existing module [overwrite])',
      );
      await ClearGraph(driver);

      // Create a simple one module workflow
      const module = await driver.findElement(By.id('modulelist-payload_run'));
      const canvas = await driver.findElement(By.className('react-flow__pane'));
      await DragAndDrop(driver, module, canvas);
      // 'Build & Run' - 'Build Module' - 'test-repo' - 'New Project'
      const menuBuild = await driver.findElement(By.id('btnBuildAndRunDropdown'));
      await menuBuild.click();
      const menuBuildModule = menuBuild.findElement(
        By.xpath('//li[text()="MODULE FROM WORKFLOW"]'),
      );
      await menuBuildModule.click();
      const menuTestRepo = await menuBuildModule.findElement(By.xpath('//li[text()="test-repo"]'));
      await menuTestRepo.click();
      // 'My New Project' - 'New Module'
      const menuProjectFolder = await menuTestRepo.findElement(
        By.xpath('//li[text()="MyNewProject"]'),
      );
      await menuProjectFolder.click();
      const btnExistingModule = await menuProjectFolder.findElement(
        By.xpath('//li[text()="MyNewModule2"]'),
      );
      await btnExistingModule.click();
      // 'Overwrite existing module' dialog
      await driver.findElement(By.xpath('//button[text()="Confirm"]')).click();
      // Wait for module to build, and check return code
      let msg = await WaitForReturnCode(driver, 'builder/build-as-module');
      expect(msg.returncode).toEqual(0);

      console.log(
        '<<< test Build module to local repository (existing project, existing module [overwrite])',
      );
    },
    ONE_MINUTE,
  );

  test(
    'Tidy-up: Ensure new project and modules were created, then remove from repository',
    async () => {
      console.log(
        '::: test Tidy-up: Ensure new project and modules were created, then remove from repository',
      );

      // Check that new project and modules were created
      const project_folder = path.join(__dirname, 'test-repo', 'workflows', 'MyNewProject');
      expect(fs.existsSync(project_folder)).toBeTruthy();
      ['MyNewModule', 'MyNewModule2'].forEach((modulename) => {
        const mymodule_folder = path.join(project_folder, 'modules', modulename);
        expect(fs.existsSync(mymodule_folder)).toBeTruthy();
        expect(fs.existsSync(path.join(mymodule_folder, 'workflow', 'Snakefile'))).toBeTruthy();
        expect(fs.existsSync(path.join(mymodule_folder, 'config', 'config.yaml'))).toBeTruthy();
      });

      // Remove new projects folder
      fs.rmSync(project_folder, { recursive: true, force: true });

      // Ensure new project and modules were removed
      expect(fs.existsSync(project_folder)).toBeFalsy();

      console.log(
        '<<< test Tidy-up: Ensure new project and modules were created, then remove from repository',
      );
    },
    ONE_MINUTE,
  );

  // Container tests
  runif(run_container_tests && is_installed(['docker'])).each([
    [
      // NOTE: This test relies on the remote module jsbrittain/snakeshack (Utilty) touch
      'container_touch',
      [
        // target files
        path.join('results', 'utility_touch', 'data.csv'),
      ],
      [
        // packaged payload files
      ],
    ],
  ])(
    "Build, extract zip, run in Docker container: module '%s'",
    async (modulename, target_files, payload_files) => {
      await Build_RunWithDocker_SingleModuleWorkflow({
        driver: driver,
        modulename: modulename,
        target_outfiles: target_files,
        payload_outfiles: payload_files,
        expand_module: true,
        packaged: false,
      });
    },
    20 * ONE_MINUTE,
  ); // long timeout

  // Package workflow (container test)
  runif(run_container_tests && is_installed(['docker'])).each([
    [
      'payload run',
      [
        // target files
        path.join('results', 'payload_run', 'data.csv'),
      ],
      [
        // packaged payload files
        path.join(
          'workflow',
          'modules',
          'local',
          'test-repo',
          'workflows',
          'single_modules',
          'sources',
          'payload_run',
          'resources',
          'file',
        ),
      ],
    ],
  ])(
    "Package workflow (container): module '%s'",
    async (modulename, target_files, payload_files) => {
      // Build and run workflow (packaged)
      console.log('::: Package workflow (container)');
      await Build_RunWithDocker_SingleModuleWorkflow({
        driver: driver,
        modulename: modulename,
        target_outfiles: target_files,
        payload_outfiles: payload_files,
        expand_module: false,
        packaged: true,
      });
    },
    10 * ONE_MINUTE,
  ); // long timeout
});
