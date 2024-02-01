import { By } from "selenium-webdriver";
import { Key } from "selenium-webdriver";
import { Select } from "selenium-webdriver/lib/select";
import { until } from "selenium-webdriver";

import * as chrome from "selenium-webdriver/chrome";
import * as path from "path";
import * as webdriver from "selenium-webdriver";

import { runif } from "./utils";
import { is_windows } from "./utils";
import { is_installed } from "./utils";
import { dragAndDrop } from "./utils";
import { FlushConsoleLog } from "./utils";
import { RedirectConsoleLog } from "./utils";
import { WaitForReturnCode } from "./utils";
import { EasyEdit_SetFieldByKey } from "./utils";
import { BuildAndRun_SingleModuleWorkflow } from "./utils";
import { BuildAndRun_MultiModuleWorkflow } from "./utils";
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
    await driver.findElement(By.id("btnSidenavSettings")).click();

    // Clear repository list
    const repo_list = new Select(
      await driver.findElement(By.id("selectBuilderSettingsRepositoryList"))
    );
    let options = await repo_list.getOptions();
    for (let i = 0; i < options.length; i++) {
      await repo_list.selectByIndex(0);
      await driver
        .findElement(By.id("buttonBuilderSettingsRepositoryListRemoveItem"))
        .click();
    }
    options = await repo_list.getOptions();
    expect(options.length).toEqual(0);

    // Set new (local) repository type
    const repo_type = new Select(
      await driver.findElement(By.id("selectBuilderSettingsRepositoryType"))
    );
    await repo_type.selectByVisibleText("Local filesystem");

    // Set new (local) repository label
    const repo_label = await driver.findElement(
      webdriver.By.id("inputBuilderSettingsRepositoryLabel")
    );
    await repo_label.clear();
    await repo_label.sendKeys("test-repo");

    // Set new (local) repository path
    const repo_path = await driver.findElement(
      webdriver.By.id("inputBuilderSettingsRepositoryURL")
    );
    await repo_path.clear();
    await repo_path.sendKeys(path.join(__dirname, "test-repo"));

    // Add repository to repository list
    await driver
      .findElement(By.id("buttonBuilderSettingsRepositoryListAddItem"))
      .click();

    // Close settings pane
    await driver.findElement(By.id("btnSidenavBuilder")).click();
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
      until.elementLocated(By.id("modulelist-_single_modules__payload_shell")),
      TEN_SECS
    );
    console.log("<<< test Get local modules list");
  });

  test(
    "Expand multi-nodes (with input and output connections)",
    async () => {
      console.log(
        "::: test Expand multi-nodes (with input and output connections)"
      );

      // Drag-and-drop the same hierarchical modules into the scene three times
      await driver.findElement(By.id("btnBuilderClearScene")).click();
      const module = await driver.findElement(
        By.id("modulelist-_multi_modules__copy_run3")
      );
      const canvas = await driver.findElement(By.className("react-flow__pane"));
      await ["n0", "n1", "n2"].forEach(async () => {
        await driver.actions().dragAndDrop(module, canvas).perform();
        await driver.sleep(100);
      });
      await driver.findElement(By.id("buttonReactflowArrange")).click();

      // Connect the modules together
      await driver
        .actions()
        .dragAndDrop(
          await driver.findElement(By.xpath('//div[@data-id="n0-out-source"]')),
          await driver.findElement(
            By.xpath('//div[@data-id="n1-single_modules_copy_run$-target"]')
          )
        )
        .perform(); // n0-to-n1
      await driver
        .actions()
        .dragAndDrop(
          await driver.findElement(By.xpath('//div[@data-id="n1-out-source"]')),
          await driver.findElement(
            By.xpath('//div[@data-id="n2-single_modules_copy_run$-target"]')
          )
        )
        .perform(); // n1-to-n2

      // Check connections before expansion
      let conns = [
        ["n0", "n1"],
        ["n1", "n2"],
      ];
      await conns.forEach(async ([nodefrom, nodeto]) => {
        await driver.wait(
          until.elementLocated(
            By.xpath(
              `//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`
            )
          )
        );
      });
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(
              `//*[@aria-label and contains(@class, "react-flow__edge")]`
            )
          )
        ).length
      ).toEqual(conns.length);

      // Expand the centre module and check connections
      conns = [
        ["n0", "n3"],
        ["n3", "n4"],
        ["n4", "n5"],
        ["n5", "n2"],
      ];
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderExpand")));
      await driver.findElement(By.id("btnBuilderExpand")).click();
      await conns.forEach(async ([nodefrom, nodeto]) => {
        await driver.wait(
          until.elementLocated(
            By.xpath(
              `//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`
            )
          )
        );
      });
      // Once all expected nodes are found, check the total count
      console.log("Checking connections... length = ");
      console.log(
        (
          await driver.findElements(
            By.xpath(
              `//*[@aria-label and contains(@class, "react-flow__edge")]`
            )
          )
        ).length
      );
      console.log(conns);
      console.log(conns.length);
      await expect(
        (
          await driver.findElements(
            By.xpath(
              `//*[@aria-label and contains(@class, "react-flow__edge")]`
            )
          )
        ).length
      ).toEqual(conns.length);

      // Next, expand the leading module and check connections
      conns = [
        ["n1", "n6"],
        ["n6", "n7"],
        ["n7", "n3"],
        ["n3", "n4"],
        ["n4", "n5"],
        ["n5", "n2"],
      ];
      await driver.findElement(By.xpath(`//div[@data-id="n0"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderExpand")));
      await driver.findElement(By.id("btnBuilderExpand")).click();
      await conns.forEach(async ([nodefrom, nodeto]) => {
        await driver.wait(
          until.elementLocated(
            By.xpath(
              `//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`
            )
          )
        );
      });
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(
              `//*[@aria-label and contains(@class, "react-flow__edge")]`
            )
          )
        ).length
      ).toEqual(conns.length);

      // Finally, expand the trailing module and check connections
      conns = [
        ["n1", "n6"],
        ["n6", "n7"],
        ["n7", "n3"],
        ["n3", "n4"],
        ["n4", "n5"],
        ["n5", "n0"],
        ["n0", "n8"],
        ["n8", "n9"],
      ];
      await driver.findElement(By.xpath(`//div[@data-id="n2"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderExpand")));
      await driver.findElement(By.id("btnBuilderExpand")).click();
      await conns.forEach(async ([nodefrom, nodeto]) => {
        await driver.wait(
          until.elementLocated(
            By.xpath(
              `//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`
            )
          )
        );
      });
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(
              `//*[@aria-label and contains(@class, "react-flow__edge")]`
            )
          )
        ).length
      ).toEqual(conns.length);

      console.log(
        "<<< test Expand multi-nodes (with input and output connections)"
      );
    },
    5 * ONE_MINUTE
  );

  runif(!is_windows)(
    "Module validation (dependency checks)",
    async () => {
      console.log("::: test Module validation (dependency checks)");

      // Drag-and-drop a source and copy module into the scene
      await driver.findElement(By.id("btnBuilderClearScene")).click();
      const canvas = await driver.findElement(By.className("react-flow__pane"));
      await dragAndDrop(
        driver,
        driver.findElement(By.id(`modulelist-_single_modules__payload_run`)),
        canvas
      );
      await driver.sleep(100);
      await dragAndDrop(
        driver,
        driver.findElement(By.id(`modulelist-_single_modules__copy_run`)),
        canvas
      );
      await driver.sleep(100);
      await driver.findElement(By.id("buttonReactflowArrange")).click();
      await driver.sleep(100);

      // Connect the modules together
      await driver
        .actions()
        .dragAndDrop(
          driver.findElement(By.xpath('//div[@data-id="n0-out-source"]')),
          driver.findElement(By.xpath('//div[@data-id="n1-in-target"]'))
        )
        .perform(); // n1-to-n2

      // Select target module and click 'Validate'
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderValidate")));
      await driver.findElement(By.id("btnBuilderValidate")).click();
      let msg = await WaitForReturnCode(
        driver,
        "runner/check-node-dependencies"
      );
      expect(msg.returncode).toEqual(0); // 0 = success

      // Change the expected file name in the source module
      await driver.findElement(By.xpath(`//div[@data-id="n0"]`)).click();
      await driver.sleep(100); // Wait for module settings to expand
      await EasyEdit_SetFieldByKey(driver, "filename", "mismatch");

      // Select target module and click 'Validate'
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderValidate")));
      await driver.findElement(By.id("btnBuilderValidate")).click();
      msg = await WaitForReturnCode(driver, "runner/check-node-dependencies");
      expect(msg.returncode).toEqual(1); // 1 = missing dependency

      console.log(
        "<<< test Expand multi-nodes (with input and output connections)"
      );
    },
    5 * ONE_MINUTE
  );

  test("Construct single module workflow in GRAPEVNE", async () => {
    console.log("::: test Construct single module workflow in GRAPEVNE");

    // Drag-and-drop module from modules-list into scene
    await driver.findElement(By.id("btnBuilderClearScene")).click();
    const module = await driver.findElement(
      By.id("modulelist-_single_modules__payload_shell")
    );
    const canvas = await driver.findElement(By.className("react-flow__pane"));
    await dragAndDrop(driver, module, canvas);
    // Give time for the module to be created on the canvas,
    // and for the config to load
    await driver.sleep(100);

    // Wait for module to be added to the scene and for the config to load
    console.log("<<< test Construct single module workflow in GRAPEVNE");
  });

  runif(!is_windows).each([
    [
      "(single_modules) payload shell",
      path.join("single_modules_payload_shell", "data.csv"),
    ],
    [
      "(single_modules) payload run",
      path.join("single_modules_payload_run", "data.csv"),
    ],
  ])(
    "Build and Test the workflow: module '%s'",
    async (modulename, outfile) => {
      // Open settings pane
      await driver.findElement(By.id("btnSidenavSettings")).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(
        webdriver.By.id("inputBuilderSettingsSnakemakeArgs")
      );
      await args.clear();
      await args.sendKeys("--cores 1");

      // Close settings pane
      await driver.findElement(By.id("btnSidenavBuilder")).click();
      console.log("<<< test Set snakemake arguments list to use conda");

      // Build and run workflow
      await BuildAndRun_SingleModuleWorkflow(driver, modulename, outfile);
    },
    5 * ONE_MINUTE
  ); // long timeout

  runif(!is_windows).each([
    // Test: 1 (connect two modules)
    [
      [
        // Modules to add to scene
        "(single_modules) payload shell", // data-nodeid="n0"
        "(single_modules) copy run", // data-nodeid="n1"
      ],
      [
        // Connections to make between modules
        ["n0-out-source", "n1-in-target"], // (nodeid)-(portname)-(porttype)
      ],
      [
        // Expected output files
        path.join("single_modules_copy_run", "data.csv"),
      ],
    ],
    // Test: 2 (connect five modules, including 4 duplicates)
    [
      [
        // Modules to add to scene
        "(single_modules) payload shell", // data-nodeid="n0"
        "(single_modules) copy run", // data-nodeid="n1"
        "(single_modules) copy run", // data-nodeid="n2"
        "(single_modules) copy run", // data-nodeid="n3"
        "(single_modules) copy run", // data-nodeid="n4"
      ],
      [
        // Connections to make between modules
        ["n0-out-source", "n1-in-target"], // (nodeid)-(portname)-(porttype)
        ["n1-out-source", "n2-in-target"],
        ["n2-out-source", "n3-in-target"],
        ["n3-out-source", "n4-in-target"],
      ],
      [
        // Expected output files
        path.join("single_modules_copy_run_3", "data.csv"),
      ],
    ],
    // Test: 3 (connect source to triple input module)
    [
      [
        // Modules to add to scene
        "(single_modules) payload shell", // data-nodeid="n0"
        "(single_modules) copy run multiport", // data-nodeid="n1"
      ],
      [
        // Connections to make between modules
        ["n0-out-source", "n1-in1-target"], // (nodeid)-(portname)-(porttype)
      ],
      [
        // Expected output files
        path.join("single_modules_copy_run_multiport", "data.csv"),
      ],
    ],
  ])(
    "Build and Test the workflow: module '%s'",
    async (modulenames, connections, outfiles) => {
      // Open settings pane
      await driver.findElement(By.id("btnSidenavSettings")).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(
        webdriver.By.id("inputBuilderSettingsSnakemakeArgs")
      );
      await args.clear();
      await args.sendKeys("--cores 1");

      // Close settings pane
      await driver.findElement(By.id("btnSidenavBuilder")).click();
      console.log("<<< test Set snakemake arguments list to use conda");

      // Build and run workflow
      await BuildAndRun_MultiModuleWorkflow(
        driver,
        modulenames,
        connections,
        outfiles
      );
    },
    5 * ONE_MINUTE
  ); // long timeout

  runif(is_installed(["mamba", "conda"], "any"))(
    "Set snakemake arguments list to use conda",
    async () => {
      console.log("::: test Set snakemake arguments list to use conda");
      // Open settings panel
      await driver.findElement(By.id("btnSidenavSettings")).click();

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
      await driver.findElement(By.id("btnSidenavBuilder")).click();
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
