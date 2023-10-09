import { By } from "selenium-webdriver";

import * as fs from "fs";
import * as path from "path";
import * as webdriver from "selenium-webdriver";
import decompress = require("decompress");

import { exec } from "child_process";
import * as util from "util";
const execPromise = util.promisify(exec);

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
  query: string
): Promise<Query> => {
  console.log("::: WaitForReturnCode");
  // Monitor console.log until a returncode is received
  let msg = undefined;
  let msg_set = undefined;
  console.log("Waiting for return msg...");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    msg_set = (await driver.executeScript(
      "return _msg_queue.shift()"
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

const DragAndDrop = async (
  driver: webdriver.ThenableWebDriver,
  elementFrom: webdriver.WebElement,
  elementTo: webdriver.WebElement
) => {
  // Drag and drop replacement for Selenium (due to HTML5 issue)
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
    elementTo
  );
};

const BuildAndRun_SingleModuleWorkflow = async (
  driver: webdriver.ThenableWebDriver,
  modulename: string,
  outfile: string
) => {
  console.log("::: test Build and Test the workflow");

  // Drag-and-drop module from modules-list into scene
  await driver.findElement(By.id("btnBuilderClearScene")).click();
  const module = await driver.findElement(
    By.id("modulelist-" + wranglename(modulename))
  );
  const canvas = await driver.findElement(By.id("nodemapper-canvas"));
  DragAndDrop(driver, module, canvas);
  // Give time for the module to be created on the canvas,
  // and for the config to load
  await driver.sleep(500);

  // Clean build folder (initial); assert target output does not exist
  let msg;
  await driver.findElement(By.id("btnBuilderCleanBuildFolder")).click();
  msg = await WaitForReturnCode(driver, "builder/clean-build-folder");
  expect(msg.returncode).toEqual(0);
  const target_file = path.join(
    (msg.body as Query).path as string,
    "results",
    outfile
  );
  console.log("target_file: ", target_file);
  expect(fs.existsSync(target_file)).toBeFalsy();

  // Build and test; assert output file exists
  await driver.findElement(By.id("btnBuilderBuildAndTest")).click();
  msg = await WaitForReturnCode(driver, "builder/build-and-run");
  expect(msg.returncode).toEqual(0);
  expect(fs.existsSync(target_file)).toBeTruthy();

  // Clean build folder (tidy-up); assert target output does not exist
  await driver.findElement(By.id("btnBuilderCleanBuildFolder")).click();
  msg = await WaitForReturnCode(driver, "builder/clean-build-folder");
  expect(msg.returncode).toEqual(0);
  expect(fs.existsSync(target_file)).toBeFalsy();

  console.log("<<< test Build and Test the workflow");
};

const Build_RunWithDocker_SingleModuleWorkflow = async (
  driver: webdriver.ThenableWebDriver,
  modulename: string,
  outfile: string
) => {
  console.log("::: test Build, then launch in Docker");

  // Drag-and-drop module from modules-list into scene
  await driver.findElement(By.id("btnBuilderClearScene")).click();
  const module = await driver.findElement(
    By.id("modulelist-" + wranglename(modulename))
  );
  const canvas = await driver.findElement(By.id("nodemapper-canvas"));
  DragAndDrop(driver, module, canvas);
  // Give time for the config to load and for the module to be created on the canvas
  await driver.sleep(5000);

  // Open the module in the editor and Expand, replacing the module with its sub-modules
  //
  // We do this as modules with absolute paths to local modules will fail to build
  // in the docker image (as the local modules are not available to the container).
  // Instead, we expand a local module which contains a link to a remote module (this
  // can be loaded remotely from the docker container).
  //
  // TODO: This is a workaround until local module loading is supported within
  // containerised builds.

  // Click on the canvas module element. This actually finds both the repository entry
  // and the canvas element, so we click on both as we cannot guarantee ordering.
  const elements = await driver.findElements(
    By.xpath(`//div[text()='${modulename}']`)
  );
  for (const element of elements) await element.click();
  await driver.sleep(500); // Wait for module settings to expand
  await driver.findElement(By.id("btnBuilderExpand")).click();

  // Assert that build file does not exist
  const buildfile = path.join(__dirname, "downloads", "build.zip");
  if (fs.existsSync(buildfile)) fs.unlinkSync(buildfile);
  expect(fs.existsSync(buildfile)).toBeFalsy();

  // Build, outputs zip-file
  await driver.findElement(By.id("btnBuilderBuildAndZip")).click();
  const msg = await WaitForReturnCode(driver, "builder/compile-to-json");
  expect(msg.returncode).toEqual(0);

  // Wait for build file to be downloaded --- test will timeout if this fails repeatedly
  while (!fs.existsSync(buildfile)) {
    await driver.sleep(500);
  }
  expect(fs.existsSync(buildfile)).toBeTruthy();

  // Unzip build file
  const buildfolder = path.join(__dirname, "downloads", "build");
  if (fs.existsSync(buildfolder)) fs.rmSync(buildfolder, { recursive: true });
  fs.mkdirSync(buildfolder);
  await unzip(buildfile, buildfolder);

  // Build and launch docker container; assert that workflow output file exists
  const dockerfile = path.join(buildfolder, "Dockerfile");
  expect(fs.existsSync(dockerfile)).toBeTruthy();

  // Assert that the target output file does not exist
  const target_file = path.join(buildfolder, "results", outfile);
  console.log("target_file: ", target_file);
  expect(fs.existsSync(target_file)).toBeFalsy();

  // Launch docker and wait for process to finish
  const { stdout, stderr } = await execPromise(
    path.join(buildfolder, "run_docker.sh")
  );
  if (stdout) console.log(stdout);
  if (stderr) console.log(stderr);
  expect(fs.existsSync(target_file)).toBeTruthy();

  // Clean build folder (tidy-up); assert target output does not exist
  fs.rmSync(buildfile);
  //fs.rmSync(buildfolder, { recursive: true });
  expect(fs.existsSync(buildfile)).toBeFalsy();
  //expect(fs.existsSync(target_file)).toBeFalsy();

  console.log("<<< test Build, then launch in Docker");
};

export {
  RedirectConsoleLog,
  FlushConsoleLog,
  WaitForReturnCode,
  DragAndDrop,
  BuildAndRun_SingleModuleWorkflow,
  Build_RunWithDocker_SingleModuleWorkflow,
};
