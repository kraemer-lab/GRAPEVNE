import { By } from "selenium-webdriver";
import { Select } from "selenium-webdriver/lib/select";
import { until } from "selenium-webdriver";

import * as chrome from "selenium-webdriver/chrome";
import * as path from "path";
import * as webdriver from "selenium-webdriver";

import { runif } from "./utils";
import { is_installed } from "./utils";
import { is_not_windows } from "./utils";
import { DragAndDrop } from "./utils";
import { FlushConsoleLog } from "./utils";
import { RedirectConsoleLog } from "./utils";
import { WaitForReturnCode } from "./utils";
import { BuildAndRun_SingleModuleWorkflow } from "./utils";
import { Build_RunWithDocker_SingleModuleWorkflow } from "./utils";

const ONE_SEC = 1000;
const TEN_SECS = 10 * ONE_SEC;
const ONE_MINUTE = 60 * ONE_SEC;

/*
 * Note: These tests chain together, so they must be run in order.
 */
describe("modules", () => {
  let driver: webdriver.ThenableWebDriver;

  beforeAll(async () => {
    console.log("::: beforeAll");

    // Start webdriver
    const options = new chrome.Options();
    options.debuggerAddress("localhost:9515");
    driver = new webdriver.Builder()
      .forBrowser("chrome", "118")
      .setChromeOptions(options)
      .build();
    console.log("Webdriver started.");

    await RedirectConsoleLog(driver);
    console.log("<<< beforeAll");
  }, ONE_MINUTE);

  afterAll(async () => {
    console.log("::: afterAll");
    await driver.close();
    await driver.quit();
    console.log("<<< afterAll");
  });

  beforeEach(async () => {
    console.log("::: beforeEach");
    await FlushConsoleLog(driver);
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
    await driver.findElement(By.id("btnBuilderSettings")).click();

    // Select local repository
    const repo_type = new Select(
      await driver.findElement(By.id("selectBuilderSettingsRepositoryType"))
    );
    await repo_type.selectByVisibleText("Local filesystem");

    // Set local repository path
    const repo_path = await driver.findElement(
      webdriver.By.id("inputBuilderSettingsRepositoryURL")
    );
    await repo_path.clear();
    await repo_path.sendKeys(path.join(__dirname, "test-repo"));

    // Close settings pane
    await driver.findElement(By.id("btnBuilderSettings")).click();
    console.log("<<< test Select test repository");
  });

  test("Get local modules list", async () => {
    console.log("::: test Get local modules list");
    // Get modules list
    await driver.findElement(By.id("btnBuilderGetModuleList")).click();
    const msg = await WaitForReturnCode(driver, "builder/get-remote-modules");
    expect(msg.returncode).toEqual(0);
    // Wait for module list to be populated
    await driver.wait(
      until.elementLocated(By.id("modulelist-_single_modules__copy_shell")),
      TEN_SECS
    );
    console.log("<<< test Get local modules list");
  });

  test("Construct single module workflow in GRAPEVNE", async () => {
    console.log("::: test Construct single module workflow in GRAPEVNE");

    // Drag-and-drop module from modules-list into scene
    await driver.findElement(By.id("btnBuilderClearScene")).click();
    const module = await driver.findElement(
      By.id("modulelist-_single_modules__copy_shell")
    );
    const canvas = await driver.findElement(By.id("nodemapper-canvas"));
    DragAndDrop(driver, module, canvas);
    // Give time for the module to be created on the canvas,
    // and for the config to load
    await driver.sleep(500);

    // Wait for module to be added to the scene and for the config to load
    console.log("<<< test Construct single module workflow in GRAPEVNE");
  });

  test.each([
    [
      "(single_modules) copy shell",
      path.join("single_modules_copy_shell", "data.csv"),
    ],
    [
      "(single_modules) copy run",
      path.join("single_modules_copy_run", "data.csv"),
    ],
  ])(
    "Build and Test the workflow: module '%s'",
    async (modulename, outfile) => {
      await BuildAndRun_SingleModuleWorkflow(driver, modulename, outfile);
    },
    5 * ONE_MINUTE
  ); // long timeout

  runif(is_installed(["mamba", "conda"], "any"))(
    "Set snakemake arguments list to use conda",
    async () => {
      console.log("::: test Set snakemake arguments list to use conda");
      // Open settings pane
      await driver.findElement(By.id("btnBuilderSettings")).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(
        webdriver.By.id("inputBuilderSettingsSnakemakeArgs")
      );
      await args.clear();
      await args.sendKeys("--cores 1 --use-conda");

      // Set conda environment path --- passthrough from test environment
      if (process.env.CONDA_PATH != undefined) {
        const args = await driver.findElement(
          webdriver.By.id("inputBuilderSettingsEnvironmentVars")
        );
        await args.clear();
        await args.sendKeys(`PATH=${process.env.CONDA_PATH}`);
      }

      // Close settings pane
      await driver.findElement(By.id("btnBuilderSettings")).click();
      console.log("<<< test Set snakemake arguments list to use conda");
    }
  );

  // Basic workflow tests (those that do not require conda)
  test.skip.each([
    // placeholder (empty and skipped at present)
    ["PLACEHOLDER", ""],
  ])(
    "Build and Test the workflow: module '%s'",
    async (modulename, outfile) => {
      await BuildAndRun_SingleModuleWorkflow(driver, modulename, outfile);
    },
    10 * ONE_MINUTE
  ); // long timeout

  // Conda tests
  runif(is_installed(["mamba", "conda"], "any")).each([
    ["(single_modules) conda", path.join("single_modules_conda", "data.csv")],
  ])(
    "Build and Test the conda workflow: module '%s'",
    async (modulename, outfile) => {
      await BuildAndRun_SingleModuleWorkflow(driver, modulename, outfile);
    },
    10 * ONE_MINUTE
  ); // long timeout

  // Container tests
  runif(is_installed(["docker"])).each([
    [
      // NOTE: This test relies on the remote module jsbrittain/snakeshack (Utilty) touch
      "(single_modules) container_touch",
      path.join("utility_touch", "data.csv"),
    ],
  ])(
    "Build, extract zip, run in Docker: module '%s'",
    async (modulename, outfile) => {
      await Build_RunWithDocker_SingleModuleWorkflow(
        driver,
        modulename,
        outfile
      );
    },
    20 * ONE_MINUTE
  ); // long timeout
});
