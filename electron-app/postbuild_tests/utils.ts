import { By, Key, until } from 'selenium-webdriver';

import * as fs from 'fs';
import * as os from 'node:os';
import * as path from 'path';
import * as webdriver from 'selenium-webdriver';
import decompress = require('decompress');

import { exec } from 'child_process';
import * as shell from 'shelljs';
import * as util from 'util';
const execPromise = util.promisify(exec);
const opts = { async: undefined, bridge: undefined }; // driver.actions() options

// Test runner conditionals
const runif = (condition: boolean) => (condition ? it : it.skip);
const is_installed = (programs: string[], condition = 'all') => {
  /* Check if a list of programs is present
   * User may specify when any or all of the programs are installed
   *
   * program: list of programs to seach for (e.g. ['mamba', 'conda'])
   * condition: condition for test passing ('all', 'any' are present)
   */
  let returncode = true;
  for (const program of programs) {
    const program_check = shell.exec(`${program} --version`, { silent: true }).code == 0;
    switch (condition) {
      case 'any':
        returncode ||= program_check;
        break;
      case 'all':
        returncode &&= program_check;
        break;
      default:
        console.error(`Unknown program check requested: ${condition}`);
        returncode = false;
    }
  }
  return returncode;
};
const is_windows = process.platform === 'win32';
const is_not_windows = !is_windows;

type Query = Record<string, unknown>;

const unzip = async (buildfile: string, buildfolder: string) => {
  await decompress(buildfile, buildfolder);
};

const wranglename = (name: string) => {
  // Wrangle name to remove spaces and special characters
  return name.replace(/ /g, '_').replace(/\(/g, '_').replace(/\)/g, '_');
};

const RedirectConsoleLog = async (driver: webdriver.ThenableWebDriver) => {
  // Capture console.log messages for backend return values
  console.log('::: RedirectConsoleLog');
  await driver.executeScript(`
    _msg_queue = [];  // empty msg queue
    (function() {
      var exLog = console.log;  // store original console.log function
      console.log = function() {  // override console.log function
        exLog.apply(console, arguments);  // passthrough to original console.log function
        _msg_queue.push(arguments);  // push msg to queue
      }
      var exDebug = console.debug;
      console.debug = function() {
        exDebug.apply(console, arguments);
        _msg_queue.push(arguments);
      }
    })()
  `);
  console.log('<<< RedirectConsoleLog');
};

const FlushConsoleLog = async (driver: webdriver.ThenableWebDriver) => {
  // Flush console.log messages for backend return values
  console.log('::: FlushConsoleLog');
  await driver.executeScript(`
    _msg_queue = [];  // empty msg queue
  `);
  console.log('<<< FlushConsoleLog');
};

// Wait for return code
const WaitForReturnCode = async (
  driver: webdriver.ThenableWebDriver,
  query: string,
): Promise<Query> => {
  console.log('::: WaitForReturnCode');

  /* Warning: This routine can fail if the message object is a Proxy */

  // Monitor console.log until a returncode is received
  let msg = undefined;
  let msg_set = undefined;
  console.log('Waiting for return msg...');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    msg_set = (await driver.executeScript('return _msg_queue.shift()')) as unknown[];
    if (msg_set === undefined || msg_set === null) continue;
    while (msg_set.length > 0) {
      msg = msg_set.shift();
      if (typeof msg === 'object' && msg != null) {
        if (
          Object.prototype.hasOwnProperty.call(msg, 'query') &&
          Object.prototype.hasOwnProperty.call(msg, 'returncode')
        ) {
          msg = msg as Query;
          if (msg.query === query && msg.returncode != undefined) {
            console.log('return msg received: ', msg);
            console.log('<<< WaitForReturnCode');
            return msg;
          }
        }
      }
    }
  }
};

const DragAndDrop = async (
  driver: webdriver.ThenableWebDriver,
  elementFrom: webdriver.WebElement,
  elementTo: webdriver.WebElement,
) => {
  if (os.platform() === 'win32') {
    // Windows implementation - see function for details
    return await DragAndDrop_script(driver, elementFrom, elementTo);
  } else {
    // webdriver seems to work fine on Linux and MacOS
    await driver.actions(opts).dragAndDrop(elementFrom, elementTo).perform();
  }
};

const DragAndDrop_script = async (
  driver: webdriver.ThenableWebDriver,
  elementFrom: webdriver.WebElement,
  elementTo: webdriver.WebElement,
) => {
  // Drag and drop replacement for Selenium (due to HTML5 issue)
  // Required for Windows tests (regular method works on Linux and MacOS)
  // Solution sourced from:
  //   https://stackoverflow.com/questions/39436870/why-drag-and-drop-is-not-working-in-selenium-webdriver
  await driver.executeScript(
    `
    function createEvent(typeOfEvent) {
      var event = document.createEvent("CustomEvent");
      event.initCustomEvent(typeOfEvent, true, true, null);
      event.dataTransfer = {
        data: {},
        setData: function (key, value) {
          this.data[key] = value;
        },
        getData: function (key) {
          return this.data[key];
        }
      };
      return event;
    }

    function dispatchEvent(element, event,transferData) {
      if (transferData !== undefined) {
        event.dataTransfer = transferData;
      }
      if (element.dispatchEvent) {
        element.dispatchEvent(event);
      } else if (element.fireEvent) {
        element.fireEvent("on" + event.type, event);
      }
    }

    function simulateHTML5DragAndDrop(element, destination) {
      var dragStartEvent = createEvent('dragstart');
      dispatchEvent(element, dragStartEvent);
      var dropEvent = createEvent('drop');
      dispatchEvent(destination, dropEvent, dragStartEvent.dataTransfer);
      var dragEndEvent = createEvent('dragend');
      dispatchEvent(element, dragEndEvent, dropEvent.dataTransfer);
    }

    var source = arguments[0];
    var destination = arguments[1];
    simulateHTML5DragAndDrop(source,destination);
    `,
    elementFrom,
    elementTo,
  );
};

const OverwriteInputField = async (element: webdriver.WebElement, newvalue: string) => {
  // First, try clearing the input (not always successful)
  await element.clear();
  // Next, try selecting all text and deleting it
  await element.sendKeys(Key.chord(Key.CONTROL, 'a'));
  await element.sendKeys(Key.BACK_SPACE);
  // Finally, delete any remaining text in the input field and replace with the new value
  const oldvalue = await element.getAttribute('value');
  let s = '';
  for (let k = 0; k < oldvalue.length; k++) s += Key.BACK_SPACE;
  s += newvalue + Key.ENTER;
  await element.sendKeys(s);
};

const SetCheckBox = async (checkbox: webdriver.WebElement, checked: boolean) => {
  // Set checkbox to checked or unchecked
  const is_checked = await checkbox.isSelected();
  if (is_checked != checked) await checkbox.click();
};

const SetCheckBoxByID = async (
  driver: webdriver.ThenableWebDriver,
  id: string,
  checked: boolean,
) => {
  // Set checkbox to checked or unchecked
  const checkbox = await driver.findElement(By.id(id));
  await SetCheckBox(checkbox, checked);
};

interface IInputFilelistAddItem {
  driver: webdriver.ThenableWebDriver;
  label: string;
  port: string;
  filename: string;
}

export const InputFilelistAddItem = async ({
  driver,
  label,
  port,
  filename,
}: IInputFilelistAddItem) => {
  // Click on the Add button
  await driver.findElement(By.id('btnInputFilesAdd')).click();
  // Set label (first enable editing by double-clicking on the item, then overwrite the value)
  const label_clickable = driver.findElement(
    By.xpath(`//div[contains(@class, "MuiDataGrid-cell") and @title="Label1"]`),
  );
  await driver.actions(opts).doubleClick(label_clickable).perform();
  await OverwriteInputField(driver.findElement(By.xpath(`//input[@value="Label1"]`)), label);
  // Set port from list
  const port_clickable = await driver.findElement(
    By.xpath(`(//div[contains(@class, "MuiDataGrid-cell") and @data-field="port"])[last()]`),
  );
  await driver.actions(opts).doubleClick(port_clickable).perform();
  await driver.findElement(By.xpath(`//li[@data-value="${port}"]`)).click();
  // Set filename
  const filename_clickable = driver.findElement(
    By.xpath(`//div[contains(@class, "MuiDataGrid-cell") and @title="filename1.ext"]`),
  );
  // Double-click on the filename to enable editing (retry on fail)
  const filename_input = `//input[@value="filename1.ext"]`;
  for (let k = 0; k < 3; k++) {
    try {
      await driver.actions(opts).doubleClick(filename_clickable).perform();
      await driver.wait(until.elementLocated(By.xpath(filename_input)), 1000);
      break;
    } catch (NoSuchElementError) {
      // Retry on fail
      continue;
    }
  }
  await OverwriteInputField(driver.findElement(By.xpath(filename_input)), filename);
};

interface IOutputFilelistAddItem {
  driver: webdriver.ThenableWebDriver;
  label: string;
  filename: string;
}

export const OutputFilelistAddItem = async ({
  driver,
  label,
  filename,
}: IOutputFilelistAddItem) => {
  // Click on the Add button
  await driver.findElement(By.id('btnOutputFilesAdd')).click();
  // Set label (first enable editing by double-clicking on the item, then overwrite the value)
  const label_clickable = driver.findElement(
    By.xpath(`//div[contains(@class, "MuiDataGrid-cell") and @title="Label1"]`),
  );
  await driver.actions(opts).doubleClick(label_clickable).perform();
  await OverwriteInputField(driver.findElement(By.xpath(`//input[@value="Label1"]`)), label);
  // Set filename
  const filename_clickable = driver.findElement(
    By.xpath(`//div[contains(@class, "MuiDataGrid-cell") and @title="filename1.ext"]`),
  );
  // Double-click on the filename to enable editing (retry on fail)
  const filename_input = `//input[@value="filename1.ext"]`;
  for (let k = 0; k < 3; k++) {
    try {
      await driver.actions(opts).doubleClick(filename_clickable).perform();
      await driver.wait(until.elementLocated(By.xpath(filename_input)), 1000);
    } catch (NoSuchElementError) {
      // Retry on fail
      continue;
    }
  }
  await OverwriteInputField(driver.findElement(By.xpath(filename_input)), filename);
};

const ClearGraph = async (driver: webdriver.ThenableWebDriver) => {
  // Clear graph
  await driver.findElement(By.id('btnGraphDropdown')).click();
  await driver.findElement(By.id('btnBuilderClearScene')).click();
  // Wait for Graph dropdown menu to close
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await driver.findElement(By.id('btnBuilderClearScene'));
      await driver.sleep(50);
    } catch (NoSuchElementError) {
      // Element has closed
      break;
    }
  }
};

interface IDropDownButton {
  driver: webdriver.ThenableWebDriver;
  dropdownId: string;
  id: string;
}

const IsElementVisible = async (driver: webdriver.ThenableWebDriver, id: string) => {
  try {
    await driver.findElement(By.id(id));
    return true;
  } catch (NoSuchElementError) {
    return false;
  }
};

const DropDownButton = async ({ driver, dropdownId, id }: IDropDownButton) => {
  // Click on dropdown until menu opens
  while (!(await IsElementVisible(driver, id))) {
    await driver.findElement(By.id(dropdownId)).click();
    await driver.sleep(250);
  }
  // Wait for Graph dropdown menu to close
  while (await IsElementVisible(driver, id)) {
    try {
      await driver.findElement(By.id(id)).click();
    } catch (NoSuchElementError) {
      break;
    }
    await driver.sleep(250);
  }
};

const CleanBuildFolder = async (driver: webdriver.ThenableWebDriver) => {
  // Clean build folder
  await DropDownButton({
    driver: driver,
    dropdownId: 'btnBuildAndRunDropdown',
    id: 'btnCleanBuildFolder',
  });
};

const BuildAndTest = async (driver: webdriver.ThenableWebDriver) => {
  // Build and test
  await DropDownButton({
    driver: driver,
    dropdownId: 'btnBuildAndRunDropdown',
    id: 'btnBuilderBuildAndTest',
  });
};

const PackageWorkflow = async (driver: webdriver.ThenableWebDriver) => {
  // Package workflow
  await DropDownButton({
    driver: driver,
    dropdownId: 'btnBuildAndRunDropdown',
    id: 'btnBuilderPackageWorkflow',
  });
};

const BuildAsWorkflow = async (driver: webdriver.ThenableWebDriver) => {
  // Build as workflow
  await DropDownButton({
    driver: driver,
    dropdownId: 'btnBuildAndRunDropdown',
    id: 'btnBuilderBuildAsWorkflow',
  });
};

const BuildAndRun_SingleModuleWorkflow = async (
  driver: webdriver.ThenableWebDriver,
  modulename: string,
  outfiles: string[],
) => {
  await BuildAndRun_MultiModuleWorkflow(driver, [modulename], [], outfiles);
};

const BuildAndRun_MultiModuleWorkflow = async (
  driver: webdriver.ThenableWebDriver,
  modulenames: string[],
  connections: string[][],
  outfiles: string[],
) => {
  console.log('::: test Build and Test the workflow');
  await MultiModuleWorkflow_Setup(driver, modulenames, connections);
  const target_files = await MultiModuleWorkflow_CleanAndDetermineTargets(
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
};

export const MultiModuleWorkflow_Setup = async (
  driver: webdriver.ThenableWebDriver,
  modulenames: string[],
  connections: string[][],
) => {
  console.log('::: test Build and Test the workflow (setup)');
  // Drag-and-drop module from modules-list into scene
  await ClearGraph(driver);
  // Force modules to be loaded in order
  for (let k = 0; k < modulenames.length; k++) {
    const module = await driver.findElement(By.id('modulelist-' + wranglename(modulenames[k])));
    const canvas = await driver.findElement(By.className('react-flow__pane'));
    await DragAndDrop(driver, module, canvas);
    await driver.wait(until.elementLocated(By.xpath(`//div[@data-id="n${k}"]`)));
  }

  // Force connections to be connected in order
  await driver.findElement(By.id('buttonReactflowArrange')).click();
  for (let k = 0; k < connections.length; k++) {
    // We can connect modules by first clicking on the source port, then the target port
    const [fromport, toport] = connections[k];
    const port1 = await driver.findElement(By.xpath(`//div[@data-id="${fromport}"]`));
    const port2 = await driver.findElement(By.xpath(`//div[@data-id="${toport}"]`));
    await DragAndDrop(driver, port1, port2);
  }
};

export const MultiModuleWorkflow_CleanAndDetermineTargets = async (
  driver: webdriver.ThenableWebDriver,
  modulenames: string[],
  connections: string[][],
  outfiles: string[],
) => {
  console.log('::: test Build and Test the workflow (CleanAndDeterminTargets)');
  // Clean build folder (initial); assert target output does not exist
  await CleanBuildFolder(driver);
  const msg = await WaitForReturnCode(driver, 'builder/clean-build-folder');
  expect(msg.returncode).toEqual(0);
  const target_files = outfiles.map((outfile) => {
    return path.join((msg.body as Query).path as string, outfile);
  });
  console.log('target_files: ', target_files);
  target_files.forEach((target_file) => {
    expect(fs.existsSync(target_file)).toBeFalsy();
  });

  return target_files;
};

interface IMultiModuleWorkflow_BuildAndCheck {
  driver: webdriver.ThenableWebDriver;
  target_files: string[];
  should_fail?: boolean;
}

export const MultiModuleWorkflow_BuildAndCheck = async ({
  driver,
  target_files,
  should_fail,
}: IMultiModuleWorkflow_BuildAndCheck) => {
  console.log('::: test Build and Test the workflow (build-and-check)');

  // Build and test; assert output files exist
  await BuildAndTest(driver);
  const msg = await WaitForReturnCode(driver, 'builder/build-and-run');
  expect(msg.returncode).toEqual(0);
  target_files.forEach((target_file) => {
    if (should_fail) expect(fs.existsSync(target_file)).toBeFalsy();
    else expect(fs.existsSync(target_file)).toBeTruthy();
  });
};

export const MultiModuleWorkflow_TidyUp = async (
  driver: webdriver.ThenableWebDriver,
  target_files: string[],
) => {
  console.log('::: test Build and Test the workflow (tidy-up)');

  // Clean build folder (tidy-up); assert target output does not exist
  await CleanBuildFolder(driver);
  const msg = await WaitForReturnCode(driver, 'builder/clean-build-folder');
  expect(msg.returncode).toEqual(0);
  target_files.forEach((target_file) => {
    expect(fs.existsSync(target_file)).toBeFalsy();
  });

  console.log('<<< test Build and Test the workflow');
};

interface IBuild_RunWithDocker_SingleModuleWorkflow {
  driver: webdriver.ThenableWebDriver;
  modulename: string;
  target_outfiles: string[];
  payload_outfiles: string[];
  expand_module: boolean;
  packaged: boolean;
}

const Build_RunWithDocker_SingleModuleWorkflow = async ({
  driver,
  modulename,
  target_outfiles,
  payload_outfiles,
  expand_module,
  packaged,
}: IBuild_RunWithDocker_SingleModuleWorkflow) => {
  console.log('::: test Build, then launch in Docker');

  // Drag-and-drop module from modules-list into scene
  console.log('Drag-and-drop module from modules-list into scene');
  await ClearGraph(driver);
  const module = await driver.findElement(By.id('modulelist-' + wranglename(modulename)));
  const canvas = await driver.findElement(By.className('react-flow__pane'));
  await DragAndDrop(driver, module, canvas);
  await driver.wait(until.elementLocated(By.xpath(`//div[@data-id="n0"]`)));
  await canvas.click(); // Click on the canvas to deselect the module

  // Open the module in the editor and Expand, replacing the module with its sub-modules
  //
  // We do this as modules with absolute paths to local modules will fail to build
  // in the docker image (as the local modules are not available to the container).
  // Instead, we expand a local module which contains a link to a remote module (this
  // can be loaded remotely from the docker container).
  //
  // This was required as local modules could not be run through containers, until
  // workflow packaging was introduced.
  if (expand_module) {
    // Click on the canvas module element. This actually finds both the repository entry
    // and the canvas element, so we click on both as we cannot guarantee ordering.
    console.log('Click the canvas module element');
    const elements = await driver.findElements(By.xpath(`//div[text()='${modulename}']`));
    for (const element of elements) await element.click();
    await driver.sleep(50); // Wait for module settings to expand
    await driver.findElement(By.id('btnBuilderExpand')).click();
  }

  // Assert that build file does not exist
  console.log('Assert that build file does not exist');
  const buildfile = path.join(__dirname, 'downloads', 'build.zip');
  if (fs.existsSync(buildfile)) fs.unlinkSync(buildfile);
  expect(fs.existsSync(buildfile)).toBeFalsy();

  // Assert that build folder does not exist
  console.log('Assert that build folder does not exist');
  const buildfolder = path.join(__dirname, 'downloads', 'build');
  if (fs.existsSync(buildfolder)) fs.rmSync(buildfolder, { recursive: true, force: true });
  expect(fs.existsSync(buildfolder)).toBeFalsy();

  // Build, outputs zip-file
  console.log('Build, outputs zip-file');
  if (packaged) {
    await PackageWorkflow(driver);
  } else {
    await BuildAsWorkflow(driver);
  }
  const msg = await WaitForReturnCode(driver, 'builder/build-as-workflow');
  expect(msg.returncode).toEqual(0);

  // Wait for build file to be downloaded
  console.log('Wait for build file to be downloaded');
  console.log('Build file: ', buildfile);
  while (!fs.existsSync(buildfile)) {
    await driver.sleep(500); // test will timeout if this fails repeatedly
  }
  expect(fs.existsSync(buildfile)).toBeTruthy();

  // Unzip build file
  console.log('Unzip build file');
  if (fs.existsSync(buildfolder)) fs.rmSync(buildfolder, { recursive: true, force: true });
  expect(fs.existsSync(buildfolder)).toBeFalsy();
  fs.mkdirSync(buildfolder);
  await unzip(buildfile, buildfolder);
  expect(fs.existsSync(buildfolder)).toBeTruthy();

  console.log('Check Snakefile:');
  console.log(fs.readFileSync(path.join(buildfolder, 'workflow', 'Snakefile'), 'utf8'));

  console.log('Check config:');
  console.log(fs.readFileSync(path.join(buildfolder, 'config', 'config.yaml'), 'utf8'));

  // Build and launch docker container; assert that workflow output file exists
  console.log('Build and launch docker container');
  const dockerfile = path.join(buildfolder, 'Dockerfile');
  expect(fs.existsSync(dockerfile)).toBeTruthy();

  // WINDOWS TEST STOPS HERE
  //
  // To this point the Windows test builds the docker file. However, these files will
  // not run on the Windows platform and are instead tested on linux and macos through
  // their respective runners.
  //
  // While the build process is consistent for Windows (i.e. the workflow
  // is produced), the launch scripts have not been translated, and the Dockerfile
  // itself relies on Docker images (notably miniforge), that are not available for the
  // Windows platform at this time.
  if (is_windows) {
    console.log('Windows platform detected: skipping container launch test...');
    return;
  }

  // Assert that the target output file does not exist
  console.log('Assert that the target output file does not exist');
  const target_files = target_outfiles.map((outfile) => {
    return path.join(buildfolder, outfile);
  });
  console.log('target_files: ', target_files);

  target_files.forEach((target_file) => {
    expect(fs.existsSync(target_file)).toBeFalsy();
  });

  console.log('Assert that the packaged payload files do exist');
  const payload_files = payload_outfiles.map((outfile) => {
    return path.join(buildfolder, outfile);
  });
  console.log('payload_files: ', payload_files);
  for (const payload_file of payload_files) {
    expect(fs.existsSync(payload_file)).toBeTruthy();
  }
  await payload_files.forEach(async (payload_file) => {
    expect(fs.existsSync(payload_file)).toBeTruthy();
  });

  // Build docker image
  console.log('Build docker image');
  let { stdout, stderr } = await execPromise(path.join(buildfolder, 'build_container.sh'));
  if (stdout) console.log(stdout);
  if (stderr) console.log(stderr);

  // Launch docker and wait for process to finish
  console.log('Launch docker and wait for process to finish');
  ({ stdout, stderr } = await execPromise(path.join(buildfolder, 'launch_container.sh')));
  if (stdout) console.log(stdout);
  if (stderr) console.log(stderr);
  console.log('Check that target file has been created');
  for (const target_file of target_files) {
    expect(fs.existsSync(target_file)).toBeTruthy();
  }

  // Clean build folder (tidy-up); assert target output does not exist
  fs.rmSync(buildfile);
  fs.rmSync(buildfolder, { recursive: true, force: true });
  expect(fs.existsSync(buildfile)).toBeFalsy();
  target_files.forEach((target_file) => {
    expect(fs.existsSync(target_file)).toBeFalsy();
  });

  console.log('<<< test Build, then launch in Docker');
};

interface IRepoListAddItem {
  driver: webdriver.ThenableWebDriver;
  label: string;
  type: string;
  url: string;
}

export const RepoListAddItem = async ({ driver, label, type, url }: IRepoListAddItem) => {
  // Click on the Add button
  await driver.findElement(By.id('buttonBuilderSettingsRepositoryListAddItem')).click();
  // Set label (first enable editing by double-clicking on the item, then overwrite the value)
  const label_clickable = driver.findElement(
    By.xpath(`//div[contains(@class, "MuiDataGrid-cell") and @title="Label 1"]`),
  );
  await driver.actions(opts).doubleClick(label_clickable).perform();
  await OverwriteInputField(driver.findElement(By.xpath(`//input[@value="Label 1"]`)), label);
  // Set type from list
  const type_clickable = await driver.findElement(
    By.xpath(`(//div[contains(@class, "MuiDataGrid-cell") and @data-field="type"])[last()]`),
  );
  await driver.actions(opts).doubleClick(type_clickable).perform();
  await driver.findElement(By.xpath(`//li[@data-value="${type}"]`)).click();
  // Set url
  const url_clickable = driver.findElement(
    By.xpath(`//div[contains(@class, "MuiDataGrid-cell") and @data-field="url"]`),
  );
  // Double-click on the url to enable editing (retry on fail)
  const url_input = `//div[contains(@class, "MuiDataGrid-cell") and @data-field="url"]/div/input`;
  for (let k = 0; k < 3; k++) {
    try {
      await driver.actions(opts).doubleClick(url_clickable).perform();
      await driver.wait(until.elementLocated(By.xpath(url_input)), 1000);
    } catch (NoSuchElementError) {
      // Retry on fail
      continue;
    }
  }
  await OverwriteInputField(driver.findElement(By.xpath(url_input)), url);
};

export {
  Build_RunWithDocker_SingleModuleWorkflow,
  BuildAndRun_MultiModuleWorkflow,
  BuildAndRun_SingleModuleWorkflow,
  ClearGraph,
  DragAndDrop,
  FlushConsoleLog,
  is_installed,
  is_not_windows,
  is_windows,
  OverwriteInputField,
  RedirectConsoleLog,
  runif,
  SetCheckBoxByID,
  WaitForReturnCode,
};
