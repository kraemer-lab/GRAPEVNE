import { By } from "selenium-webdriver";

import * as fs from "fs";
import * as path from "path";
import * as webdriver from "selenium-webdriver";

type Query = Record<string, unknown>;

const RedirectConsoleLog = async (driver: webdriver.ThenableWebDriver) => {
  // Capture console.log messages for backend return values
  console.log("::: RedirectConsoleLog");
  await driver.executeScript(`
    _msg_queue = [];  // empty msg queue
    (function() {
      var exLog = console.log;  // store original console.log function
      console.log = function() {  // override console.log function
        //exLog.apply(console, arguments);  // passthrough to original console.log function
        _msg_queue.push(arguments);  // push msg to queue
      }
      var exDebug = console.debug;
      console.debug = function() {
        //exDebug.apply(console, arguments);
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

// Wait for return code to change --- this is a terrible implementation and
// should be refactored
const WaitForReturnCode = async (
  driver: webdriver.ThenableWebDriver,
  query: string
): Promise<Query> => {
  console.log("::: WaitForReturnCode");
  // Monitor console.log until a returncode is received
  let msg = undefined;
  let msg_set = undefined;
  console.log("Waiting for return msg...");
  while (true) {  // eslint-disable-line no-constant-condition
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
        }
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

const BuildAndRunSingleModuleWorkflow = async (
  driver: webdriver.ThenableWebDriver,
  modulename: string,
  outfile: string
) => {
  console.log("::: test Build and Test the workflow");

  // Drag-and-drop module from modules-list into scene
  await driver.findElement(By.id("btnBuilderClearScene")).click();
  const module = await driver.findElement(By.id("modulelist-" + modulename));
  const canvas = await driver.findElement(By.id("nodemapper-canvas"));
  DragAndDrop(driver, module, canvas);
  // Give time for the module to be created on the canvas,
  // and for the config to load
  await driver.sleep(500);

  // Clean build folder (initial); assert target output does not exist
  let msg;
  await driver.findElement(By.id("btnBuilderCleanBuildFolder")).click();
  msg = (await WaitForReturnCode(driver, "builder/clean-build-folder"));
  expect(msg.returncode).toEqual(0);
  const target_file = path.join(msg.body.path, "results", outfile);
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

export {
  RedirectConsoleLog,
  FlushConsoleLog,
  WaitForReturnCode,
  DragAndDrop,
  BuildAndRunSingleModuleWorkflow,
};
