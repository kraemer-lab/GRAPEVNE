import { By } from "selenium-webdriver";
import { Key } from "selenium-webdriver";

import * as fs from "fs";
import * as path from "path";
import * as webdriver from "selenium-webdriver";
import * as os from "node:os";
import decompress = require("decompress");

import * as shell from "shelljs";
import { exec } from "child_process";
import * as util from "util";
const execPromise = util.promisify(exec);

// Test runner conditionals
const runif = (condition: boolean) => (condition ? it : it.skip);
const is_installed = (programs: string[], condition = "all") => {
  /* Check if a list of programs is present
   * User may specify when any or all of the programs are installed
   *
   * program: list of programs to seach for (e.g. ['mamba', 'conda'])
   * condition: condition for test passing ('all', 'any' are present)
   */
  let returncode = true;
  for (const program of programs) {
    const program_check =
      shell.exec(`${program} --version`, { silent: true }).code == 0;
    switch (condition) {
      case "any":
        returncode ||= program_check;
        break;
      case "all":
        returncode &&= program_check;
        break;
      default:
        console.error(`Unknown program check requested: ${condition}`);
        returncode = false;
    }
  }
  return returncode;
};
const is_windows = process.platform === "win32";
const is_not_windows = !is_windows;

type Query = Record<string, unknown>;

const unzip = async (buildfile: string, buildfolder: string) => {
  await decompress(buildfile, buildfolder);
};

const wranglename = (name: string) => {
  // Wrangle name to remove spaces and special characters
  return name.replace(/ /g, "_").replace(/\(/g, "_").replace(/\)/g, "_");
};

const RedirectConsoleLog = async (driver: webdriver.ThenableWebDriver) => {
  // Capture console.log messages for backend return values
  console.log("::: RedirectConsoleLog");
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
  console.log("<<< RedirectConsoleLog");
};

const FlushConsoleLog = async (driver: webdriver.ThenableWebDriver) => {
  // Flush console.log messages for backend return values
  console.log("::: FlushConsoleLog");
  await driver.executeScript(`
    _msg_queue = [];  // empty msg queue
  `);
  console.log("<<< FlushConsoleLog");
};

// Wait for return code
const WaitForReturnCode = async (
  driver: webdriver.ThenableWebDriver,
  query: string,
): Promise<Query> => {
  console.log("::: WaitForReturnCode");

  /* Warning: This routine can fail if the message object is a Proxy */

  // Monitor console.log until a returncode is received
  let msg = undefined;
  let msg_set = undefined;
  console.log("Waiting for return msg...");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    msg_set = (await driver.executeScript(
      "return _msg_queue.shift()",
    )) as unknown[];
    if (msg_set === undefined || msg_set === null) continue;
    msg = msg_set.shift();
    if (typeof msg === "object" && msg != null) {
      if (
        Object.prototype.hasOwnProperty.call(msg, "query") &&
        Object.prototype.hasOwnProperty.call(msg, "returncode")
      ) {
        msg = msg as Query;
        if (msg.query === query && msg.returncode != undefined) {
          console.log("return msg received: ", msg);
          console.log("<<< WaitForReturnCode");
          return msg;
        } else console.log("Skipping msg: ", msg, msg_set);
      }
    }
    console.log("Skipping msg: ", msg, msg_set);
  }
};

const dragAndDrop = async (
  driver: webdriver.ThenableWebDriver,
  elementFrom: webdriver.WebElement,
  elementTo: webdriver.WebElement,
) => {
  if (os.platform() === "win32") {
    // Windows implementation - see function for details
    return await dragAndDrop_script(driver, elementFrom, elementTo);
  } else {
    // webdriver seems to work fine on Linux and MacOS
    await driver.actions().dragAndDrop(elementFrom, elementTo).perform();
  }
};

const dragAndDrop_script = async (
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

const EasyEdit_SetFieldByKey = async (
  driver: webdriver.ThenableWebDriver,
  key: string,
  newvalue: string,
) => {
  // EasyEdit boxes are awkward to interact with as they regenerate using a wrapper
  // around the input box in Edit mode, and a simplified wrapper around a label when
  // not. Start by clicking on the element to enable Edit mode.
  await driver
    .findElement(By.xpath(`//span[contains(text(), "${key}")]/following::span`))
    .click();
  await driver.sleep(100); // Wait for edit box to render
  // We can send one sendKeys command to the input box before loosing focus, so
  // need to construct the command to send the correct number of backspaces to clear
  // the field, then enter the new value, then Enter to confirm the change.
  const oldvalue = await driver
    .findElement(By.xpath(`//div[@class="easy-edit-component-wrapper"]//input`))
    .getAttribute("value");
  let s = "";
  for (let k = 0; k < oldvalue.length; k++) s += Key.BACK_SPACE;
  s += newvalue + Key.ENTER;
  await driver
    .findElement(By.xpath(`//div[@class="easy-edit-component-wrapper"]//input`))
    .sendKeys(s);
};

const EasyEdit_SetFieldByValue = async (
  driver: webdriver.ThenableWebDriver,
  oldvalue: string,
  newvalue: string,
) => {
  // EasyEdit boxes are awkward to interact with as they regenerate using a wrapper
  // around the input box in Edit mode, and a simplified wrapper around a label when
  // not. Start by clicking on the element to enable Edit mode.
  await driver
    .findElement(By.xpath(`//*[contains(text(), "${oldvalue + "\n:"}")]`))
    .click();
  await driver.sleep(100); // Wait for edit box to render
  // We can send one sendKeys command to the input box before loosing focus, so
  // need to construct the command to send the correct number of backspaces to clear
  // the field, then enter the new value, then Enter to confirm the change.
  let s = "";
  for (let k = 0; k < oldvalue.length; k++) s += Key.BACK_SPACE;
  s += newvalue + Key.ENTER;
  await driver
    .findElement(By.xpath(`//div[@class="easy-edit-component-wrapper"]//input`))
    .sendKeys(s);
};

const SetCheckBox = async (
  checkbox: webdriver.WebElement,
  checked: boolean,
) => {
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
  console.log("::: test Build and Test the workflow");

  // Drag-and-drop module from modules-list into scene
  await driver.findElement(By.id("btnBuilderClearScene")).click();
  // Force modules to be loaded in order
  for (let k = 0; k < modulenames.length; k++) {
    const module = await driver.findElement(
      By.id("modulelist-" + wranglename(modulenames[k])),
    );
    const canvas = await driver.findElement(By.className("react-flow__pane"));
    await dragAndDrop(driver, module, canvas);
    // Give time for the module to be created on the canvas,
    // and for the config to load
    await driver.sleep(100);
  }

  // Force connections to be connected in order
  await driver.findElement(By.id("buttonReactflowArrange")).click();
  for (let k = 0; k < connections.length; k++) {
    // We can connect modules by first clicking on the source port, then the target port
    const [fromport, toport] = connections[k];
    const port1 = await driver.findElement(
      By.xpath(`//div[@data-id="${fromport}"]`),
    );
    const port2 = await driver.findElement(
      By.xpath(`//div[@data-id="${toport}"]`),
    );
    await dragAndDrop(driver, port1, port2);
  }

  // Clean build folder (initial); assert target output does not exist
  let msg: Record<string, unknown>;
  await driver.findElement(By.id("btnBuilderCleanBuildFolder")).click();
  msg = await WaitForReturnCode(driver, "builder/clean-build-folder");
  expect(msg.returncode).toEqual(0);
  const target_files = outfiles.map((outfile) => {
    return path.join((msg.body as Query).path as string, outfile);
  });
  console.log("target_files: ", target_files);
  target_files.forEach((target_file) => {
    expect(fs.existsSync(target_file)).toBeFalsy();
  });

  // Build and test; assert output files exist
  await driver.findElement(By.id("btnBuilderBuildAndTest")).click();
  msg = await WaitForReturnCode(driver, "builder/build-and-run");
  expect(msg.returncode).toEqual(0);
  target_files.forEach((target_file) => {
    expect(fs.existsSync(target_file)).toBeTruthy();
  });

  // Clean build folder (tidy-up); assert target output does not exist
  await driver.findElement(By.id("btnBuilderCleanBuildFolder")).click();
  msg = await WaitForReturnCode(driver, "builder/clean-build-folder");
  expect(msg.returncode).toEqual(0);
  target_files.forEach((target_file) => {
    expect(fs.existsSync(target_file)).toBeFalsy();
  });

  console.log("<<< test Build and Test the workflow");
};

interface IBuild_RunWithDocker_SingleModuleWorkflow {
  driver: webdriver.ThenableWebDriver;
  modulename: string;
  target_outfiles: string[];
  payload_outfiles: string[];
  expand_module?: boolean;
}

const Build_RunWithDocker_SingleModuleWorkflow = async ({
  driver,
  modulename,
  target_outfiles,
  payload_outfiles,
  expand_module,
}: IBuild_RunWithDocker_SingleModuleWorkflow) => {
  console.log("::: test Build, then launch in Docker");

  // Drag-and-drop module from modules-list into scene
  console.log("Drag-and-drop module from modules-list into scene");
  await driver.findElement(By.id("btnBuilderClearScene")).click();
  const module = await driver.findElement(
    By.id("modulelist-" + wranglename(modulename)),
  );
  const canvas = await driver.findElement(By.className("react-flow__pane"));
  await dragAndDrop(driver, module, canvas);
  // Give time for the config to load and for the module to be created on the canvas
  await driver.sleep(100);

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
    console.log("Click the canvas module element");
    const elements = await driver.findElements(
      By.xpath(`//div[text()='${modulename}']`),
    );
    for (const element of elements) await element.click();
    await driver.sleep(100); // Wait for module settings to expand
    await driver.findElement(By.id("btnBuilderExpand")).click();
  }

  // Assert that build file does not exist
  console.log("Assert that build file does not exist");
  const buildfile = path.join(__dirname, "downloads", "build.zip");
  if (fs.existsSync(buildfile)) fs.unlinkSync(buildfile);
  expect(fs.existsSync(buildfile)).toBeFalsy();

  // Build, outputs zip-file
  console.log("Build, outputs zip-file");
  await driver.findElement(By.id("btnBuilderBuildAsWorkflow")).click();
  const msg = await WaitForReturnCode(driver, "builder/build-as-workflow");
  expect(msg.returncode).toEqual(0);

  // Wait for build file to be downloaded
  console.log("Wait for build file to be downloaded");
  console.log("Build file: ", buildfile);
  while (!fs.existsSync(buildfile)) {
    await driver.sleep(500); // test will timeout if this fails repeatedly
  }
  expect(fs.existsSync(buildfile)).toBeTruthy();

  // Unzip build file
  console.log("Unzip build file");
  const buildfolder = path.join(__dirname, "downloads", "build");
  if (fs.existsSync(buildfolder)) fs.rmSync(buildfolder, { recursive: true });
  fs.mkdirSync(buildfolder);
  await unzip(buildfile, buildfolder);

  // Build and launch docker container; assert that workflow output file exists
  console.log("Build and launch docker container");
  const dockerfile = path.join(buildfolder, "Dockerfile");
  expect(fs.existsSync(dockerfile)).toBeTruthy();

  // WINDOWS TEST STOPS HERE
  //
  // To this point the Windows test builds the docker file. However, these files will
  // not run on the Windows platform and are instead tested on linux and macos through
  // their respective runners.
  //
  // While the build process is consistent for Windows (i.e. the workflow
  // is produced), the launch scripts have not been translated, and the Dockerfile
  // itself relies on Docker images (notably mambaforge), that are not available for the
  // Windows platform at this time.
  if (is_windows) {
    console.log("Windows platform detected: skipping container launch test...");
  } else {
    // Assert that the target output file does not exist
    console.log("Assert that the target output file does not exist");
    const target_files = target_outfiles.map((outfile) => {
      return path.join(buildfolder, outfile);
    });
    console.log("target_files: ", target_files);
    target_files.forEach((target_file) => {
      expect(fs.existsSync(target_file)).toBeFalsy();
    });

    console.log("Assert that the packaged payload files do exist");
    const payload_files = payload_outfiles.map((outfile) => {
      return path.join(buildfolder, outfile);
    });
    console.log("payload_files: ", payload_files);
    payload_files.forEach((payload_file) => {
      expect(fs.existsSync(payload_file)).toBeTruthy();
    });

    // Build docker image
    console.log("Build docker image");
    let { stdout, stderr } = await execPromise(
      path.join(buildfolder, "build_container.sh"),
    );
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);

    // Build docker image
    console.log("Build docker image");
    let { stdout, stderr } = await execPromise(
      path.join(buildfolder, "build_container.sh"),
    );
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);

    // Launch docker and wait for process to finish
    console.log("Launch docker and wait for process to finish");
    ({ stdout, stderr } = await execPromise(
      path.join(buildfolder, "launch_container.sh"),
    ));
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
    console.log("Check that target file has been created");
    target_files.forEach((target_file) => {
      expect(fs.existsSync(target_file)).toBeTruthy();
    });

    // Clean build folder (tidy-up); assert target output does not exist
    fs.rmSync(buildfile);
    fs.rmSync(buildfolder, { recursive: true });
    expect(fs.existsSync(buildfile)).toBeFalsy();
    target_files.forEach((target_file) => {
      expect(fs.existsSync(target_file)).toBeFalsy();
    });
  }

  console.log("<<< test Build, then launch in Docker");
};

export {
  runif,
  is_installed,
  is_windows,
  is_not_windows,
  dragAndDrop,
  RedirectConsoleLog,
  FlushConsoleLog,
  WaitForReturnCode,
  SetCheckBoxByID,
  EasyEdit_SetFieldByKey,
  EasyEdit_SetFieldByValue,
  BuildAndRun_SingleModuleWorkflow,
  BuildAndRun_MultiModuleWorkflow,
  Build_RunWithDocker_SingleModuleWorkflow,
};
