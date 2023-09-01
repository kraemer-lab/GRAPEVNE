import { By } from 'selenium-webdriver';
import { until } from 'selenium-webdriver';
import { Select } from 'selenium-webdriver/lib/select';
import { execSync } from 'child_process';
import * as webdriver from "selenium-webdriver";
import * as chrome from 'selenium-webdriver/chrome';
import * as path from 'path';
import * as fs from 'fs';

const ONE_SEC = 1000;
const TEN_SECS = 10000;
const ONE_MINUTE = 60000;

describe ("modules", () => {
  let driver: webdriver.ThenableWebDriver;

  const RedirectConsoleLog = async () => {
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
  }

  const FlushConsoleLog = async () => {
    // Flush console.log messages for backend return values
    console.log("::: FlushConsoleLog");
    await driver.executeScript(`
      _msg_queue = [];  // empty msg queue
    `);
    console.log("<<< FlushConsoleLog");
  }

  // Wait for return code to change --- this is a terrible implementation and
  // should be refactored
  const WaitForReturnCode = async (query: string): Promise<Record<string, any>> => {
    console.log("::: WaitForReturnCode");
    // Monitor console.log until a returncode is received
    let msg = undefined;
    let msg_set = undefined;
    console.log('Waiting for return msg...');
    while ( true ) {
      msg_set = await driver.executeScript("return _msg_queue.shift()") as any[];
      if ((msg_set === undefined) || (msg_set === null))
        continue;
      msg = msg_set.shift()
      if ((typeof msg === "object") && (msg != null)) {
        if ((Object.prototype.hasOwnProperty.call(msg, "query") &&
             Object.prototype.hasOwnProperty.call(msg, "returncode"))) {
          msg = msg as Record<string, any>;
          if ((msg.query === query) && (msg.returncode != undefined)) {
            console.log("return msg received: ", msg);
            return msg;
          }
        }
      }
      console.log("Skipping msg: ", msg, msg_set);
    }
    console.log("<<< WaitForReturnCode");
  }

  beforeAll(async () => {
    console.log("::: beforeAll");
    const options = new chrome.Options();
    options.debuggerAddress("localhost:9515");
    driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    await RedirectConsoleLog();
    console.log("<<< beforeAll");
  });

  afterAll(async () => {
    console.log("::: afterAll");
    await driver.close();
    await driver.quit();
    console.log("<<< afterAll");
  });


  beforeEach(async () => {
    console.log("::: beforeEach");
    await FlushConsoleLog();
    console.log("<<< beforeEach");
  });

  test("webdriver connected to GRAPEVNE", async () => {
    console.log("::: test webdriver connected to GRAPEVNE");
    expect(driver).not.toBeNull();
    expect(await driver.getTitle()).toBe("GRAPEVNE");
    console.log("<<< test webdriver connected to GRAPEVNE");
  });

  test("Select test repository", async () => {
    console.log("::: test Select test repository");
    // Open settings pane
    await driver.findElement(By.id('btnBuilderSettings'))
      .click();

    // Select local repository
    const repo_type = new Select(
      await driver.findElement(
        By.id("selectBuilderSettingsRepositoryType")
      )
    )
    await repo_type.selectByVisibleText("Local filesystem");
    
    // Set local repository path
    const repo_path = await driver
      .findElement(
        webdriver.By.id('inputBuilderSettingsRepositoryURL')
      )
    await repo_path
      .clear()
    await repo_path
      .sendKeys(path.join(__dirname, 'test-repo'));

    // Set environment variables
    // useful when arm64 builds are not available for conda packages
    /*
    const envvars = await driver
      .findElement(
        webdriver.By.id('inputBuilderSettingsEnvironmentVars')
      )
    await envvars
      .clear()
    await envvars
      .sendKeys('CONDA_SUBDIR=osx-64')
    */

    // Close settings pane
    await driver.findElement(By.id('btnBuilderSettings'))
      .click();
    console.log("<<< test Select test repository");
  });

  test("Get local modules list", async () => {
    console.log("::: test Get local modules list");

    // Get modules list --- return can be too fast, so setup listener first
    await driver.findElement(By.id('btnBuilderGetModuleList'))
      .click();
    const msg = await WaitForReturnCode('builder/get-remote-modules') as any;
    expect(msg.returncode).toEqual(0);
    // Wait for module list to be populated
    await driver.wait(
      until.elementLocated(By.id("modulelist-_single_modules__copy_shell")),
      TEN_SECS);
    console.log("<<< test Get local modules list");
  });

  test("Construct single module workflow in GRAPEVNE", async () => {
    console.log("::: test Construct single module workflow in GRAPEVNE");

    // Drag-and-drop module from modules-list into scene
    await driver.findElement(By.id('btnBuilderClearScene'))
      .click();
    const module = await driver.findElement(
      By.id('modulelist-_single_modules__copy_shell')
    );
    const canvas = await driver.findElement(
      By.id('nodemapper-canvas')
    );
    const actions = driver.actions();
    await actions.dragAndDrop(
      module,
      canvas
    ).perform();
    // Wait for module to be added to the scene and for the config to load
    await driver.sleep(1000);
    console.log("<<< test Construct single module workflow in GRAPEVNE");
  });

  test("Build and Test the workflow", async () => {
    console.log("::: test Build and Test the workflow");

    // Test and run the workflow (single module)
    let msg;

    // Clean build folder (initial); assert target output does not exist
    await driver.findElement(By.id('btnBuilderCleanBuildFolder'))
      .click();
    msg = await WaitForReturnCode('builder/clean-build-folder') as any;
    expect(msg.returncode).toEqual(0);
    const target_file = path.join(
      msg.body.path,
      'results',
      'single_modules_copy_shell',  // 'out',
      'data.csv'
    )
    console.log('target_file: ', target_file);
    expect(fs.existsSync(target_file)).toBeFalsy();

    // Build and test; assert output file exists
    await driver.findElement(By.id('btnBuilderBuildAndTest'))
      .click();
    msg = await WaitForReturnCode('builder/build-and-run')
    expect(msg.returncode).toEqual(0);
    expect(fs.existsSync(target_file)).toBeTruthy();
    
    // Clean build folder (tidy-up); assert target output does not exist
    await driver.findElement(By.id('btnBuilderCleanBuildFolder'))
      .click();
    msg = await WaitForReturnCode('builder/clean-build-folder')
    expect(msg.returncode).toEqual(0);
    expect(fs.existsSync(target_file)).toBeFalsy();

    console.log("<<< test Build and Test the workflow");

  }, ONE_MINUTE);  // long timeout

});
