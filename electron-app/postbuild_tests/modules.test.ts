import { By } from "selenium-webdriver";
import { Select } from "selenium-webdriver/lib/select";
import { until } from "selenium-webdriver";

import * as chrome from "selenium-webdriver/chrome";
import * as path from "path";
import * as webdriver from "selenium-webdriver";

import { runif } from "./utils";
import { is_windows } from "./utils";
import { ClearGraph } from "./utils";
import { dragAndDrop } from "./utils";
import { is_installed } from "./utils";
import { FlushConsoleLog } from "./utils";
import { SetCheckBoxByID } from "./utils";
import { WaitForReturnCode } from "./utils";
import { RedirectConsoleLog } from "./utils";
import { BuildAndRun_SingleModuleWorkflow } from "./utils";
import { BuildAndRun_MultiModuleWorkflow } from "./utils";
import { MultiModuleWorkflow_Setup } from "./utils";
import { MultiModuleWorkflow_CleanAndDetermineTargets } from "./utils";
import { MultiModuleWorkflow_BuildAndCheck } from "./utils";
import { MultiModuleWorkflow_TidyUp } from "./utils";
import { Build_RunWithDocker_SingleModuleWorkflow } from "./utils";
import { OverwriteInputField } from "./utils";

const ONE_SEC = 1000;
const TEN_SECS = 10 * ONE_SEC;
const ONE_MINUTE = 60 * ONE_SEC;

let run_container_tests = true;
process.argv.slice(2).forEach((arg) => {
  console.log(`::: ${arg}`);
  if (arg === "--no-containers") {
    console.log("Skipping container tests");
    run_container_tests = false;
  }
});

/*
 * Note: These tests chain together, so they must be run in order.
 */
describe("modules", () => {
  let driver: webdriver.ThenableWebDriver;
  jest.retryTimes(3);

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
    await driver.findElement(By.xpath('//div[@id="btnSidenavSettings"]')).click();

    // Clear repository list
    const repo_list = new Select(
      await driver.findElement(By.id("selectBuilderSettingsRepositoryList")),
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
    const repo_type = await driver.findElement(By.id("selectBuilderSettingsRepositoryType"));
    await repo_type.click();
    await repo_type.findElement(By.xpath('//li[@data-value="LocalFilesystem"]')).click();

    // Set new (local) repository label
    const repo_label = await driver.findElement(
      webdriver.By.id("inputBuilderSettingsRepositoryLabel"),
    );
    await OverwriteInputField(repo_label, "test-repo");

    // Set new (local) repository path
    const repo_path = await driver.findElement(
      webdriver.By.id("inputBuilderSettingsRepositoryURL"),
    );
    await OverwriteInputField(repo_path, path.join(__dirname, "test-repo"));

    // Add repository to repository list
    await driver
      .findElement(By.id("buttonBuilderSettingsRepositoryListAddItem"))
      .click();

    // Ensure that interface options are set as expected
    await SetCheckBoxByID(driver, "display_module_settings", false);
    await SetCheckBoxByID(driver, "auto_validate_connections", false);

    // Close settings pane
    await driver.findElement(By.xpath('//div[@id="btnSidenavBuilder"]')).click();
    console.log("<<< test Select test repository");
  },
    ONE_MINUTE
  );

  test("Get local modules list", async () => {
    console.log("::: test Get local modules list");
    // Get modules list
    await driver.findElement(By.id("btnBuilderGetModuleList")).click();
    const msg = await WaitForReturnCode(driver, "builder/get-remote-modules");
    expect(msg.returncode).toEqual(0);
    // Wait for module list to be populated
    await driver.wait(
      until.elementLocated(By.id("modulelist-payload_shell")),
      TEN_SECS,
    );
    console.log("<<< test Get local modules list");
  });

  test(
    "Expand multi-nodes (with input and output connections)",
    async () => {
      console.log(
        "::: test Expand multi-nodes (with input and output connections)",
      );

      // Drag-and-drop the same hierarchical modules into the scene three times
      await ClearGraph(driver);
      const module = await driver.findElement(
        By.id("modulelist-copy_run3"),
      );
      const canvas = await driver.findElement(By.className("react-flow__pane"));
      for (const n of ["n0", "n1", "n2"]) {
        console.log(`Dragging module to canvas: ${n}`);
        await driver.actions().dragAndDrop(module, canvas).perform();
        await driver.wait(
          until.elementLocated(
            By.xpath(
              `//div[@data-id="${n}"]`,
            ),
          ),
        );
      }
      await driver.findElement(By.id("buttonReactflowArrange")).click();

      // Connect the modules together
      await driver
        .actions()
        .dragAndDrop(
          await driver.findElement(By.xpath('//div[@data-id="n0-out-source"]')),
          await driver.findElement(
            By.xpath('//div[@data-id="n1-single_modules_copy_run$-target"]'),
          ),
        )
        .perform(); // n0-to-n1
      await driver
        .actions()
        .dragAndDrop(
          await driver.findElement(By.xpath('//div[@data-id="n1-out-source"]')),
          await driver.findElement(
            By.xpath('//div[@data-id="n2-single_modules_copy_run$-target"]'),
          ),
        )
        .perform(); // n1-to-n2

      // Check connections before expansion
      let conns = [
        ["n0", "n1"],
        ["n1", "n2"],
      ];
      for await (const [nodefrom, nodeto] of conns) {
        await driver.wait(
          until.elementLocated(
            By.xpath(
              `//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`,
            ),
          ),
        );
      }
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(
              `//*[@aria-label and contains(@class, "react-flow__edge")]`,
            ),
          )
        ).length,
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
      for await (const [nodefrom, nodeto] of conns) {
        await driver.wait(
          until.elementLocated(
            By.xpath(
              `//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`,
            ),
          ),
        );
      }
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(
              `//*[@aria-label and contains(@class, "react-flow__edge")]`,
            ),
          )
        ).length,
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
      for await (const [nodefrom, nodeto] of conns) {
        await driver.wait(
          until.elementLocated(
            By.xpath(
              `//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`,
            ),
          ),
        );
      }
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(
              `//*[@aria-label and contains(@class, "react-flow__edge")]`,
            ),
          )
        ).length,
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
      for await (const [nodefrom, nodeto] of conns) {
        await driver.wait(
          until.elementLocated(
            By.xpath(
              `//*[contains(@aria-label, "Edge from ${nodefrom} to ${nodeto}")]`,
            ),
          ),
        );
      }
      // Once all expected nodes are found, check the total count
      expect(
        (
          await driver.findElements(
            By.xpath(
              `//*[@aria-label and contains(@class, "react-flow__edge")]`,
            ),
          )
        ).length,
      ).toEqual(conns.length);

      console.log(
        "<<< test Expand multi-nodes (with input and output connections)",
      );
    },
    5 * ONE_MINUTE,
  );

  runif(!is_windows)(
    "Module validation (dependency checks)",
    async () => {
      console.log("::: test Module validation (dependency checks)");

      // Drag-and-drop a source and copy module into the scene
      await ClearGraph(driver);
      const canvas = await driver.findElement(By.className("react-flow__pane"));
      await dragAndDrop(
        driver,
        driver.findElement(By.id(`modulelist-payload_run`)),
        canvas,
      );
      await driver.wait(
        until.elementLocated(
          By.xpath(
            `//div[@data-id="n0"]`,
          ),
        ),
      );
      await dragAndDrop(
        driver,
        driver.findElement(By.id(`modulelist-copy_run`)),
        canvas,
      );
      await driver.wait(
        until.elementLocated(
          By.xpath(
            `//div[@data-id="n1"]`,
          ),
        ),
      );
      await driver.findElement(By.id("buttonReactflowArrange")).click();

      // Connect the modules together
      await driver
        .actions()
        .dragAndDrop(
          driver.findElement(By.xpath('//div[@data-id="n0-out-source"]')),
          driver.findElement(By.xpath('//div[@data-id="n1-in-target"]')),
        )
        .perform(); // n1-to-n2

      // Select target module and click 'Validate'
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderValidate")));
      await driver.findElement(By.id("btnBuilderValidate")).click();
      let msg = await WaitForReturnCode(
        driver,
        "runner/check-node-dependencies",
      );
      expect(msg.returncode).toEqual(0); // 0 = success

      // Change the expected file name in the source module
      await driver.findElement(By.xpath(`//div[@data-id="n0"]`)).click();
      await driver.sleep(50); // Wait for module settings to expand
      await OverwriteInputField(
        await driver.findElement(webdriver.By.id("nodeinfo-n0-config-params-filename")),
        "mismatch"
      );

      // Select target module and click 'Validate'
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderValidate")));
      await driver.findElement(By.id("btnBuilderValidate")).click();
      msg = await WaitForReturnCode(driver, "runner/check-node-dependencies");
      expect(msg.returncode).toEqual(1); // 1 = missing dependency

      console.log(
        "<<< test Expand multi-nodes (with input and output connections)",
      );
    },
    5 * ONE_MINUTE,
  );

  test("Construct single module workflow in GRAPEVNE", async () => {
    console.log("::: test Construct single module workflow in GRAPEVNE");

    // Drag-and-drop module from modules-list into scene
    await ClearGraph(driver);
    const module = await driver.findElement(
      By.id("modulelist-payload_shell"),
    );
    const canvas = await driver.findElement(By.className("react-flow__pane"));
    await dragAndDrop(driver, module, canvas);
    await driver.wait(
      until.elementLocated(
        By.xpath(
          `//div[@data-id="n0"]`,
        ),
      ),
    );

    // Wait for module to be added to the scene and for the config to load
    console.log("<<< test Construct single module workflow in GRAPEVNE");
  });

  runif(!is_windows).each([
    [
      "payload shell",
      [path.join("results", "payload_shell", "data.csv")],
    ],
    [
      "payload run",
      [path.join("results", "payload_run", "data.csv")],
    ],
  ])(
    "Build and Test the workflow: module '%s'",
    async (modulename, outfiles) => {
      // Open settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavSettings"]')).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(
        webdriver.By.id("inputBuilderSettingsSnakemakeArgs"),
      );
      await OverwriteInputField(args, "--cores 1");

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
        "payload shell", // data-nodeid="n0"
        "copy run", // data-nodeid="n1"
      ],
      [
        // Connections to make between modules
        ["n0-out-source", "n1-in-target"], // (nodeid)-(portname)-(porttype)
      ],
      [
        // Expected output files
        path.join("results", "copy_run", "data.csv"),
      ],
    ],
    // Test: 2 (connect five modules, including 4 duplicates)
    [
      [
        // Modules to add to scene
        "payload shell", // data-nodeid="n0"
        "copy run", // data-nodeid="n1"
        "copy run", // data-nodeid="n2"
        "copy run", // data-nodeid="n3"
        "copy run", // data-nodeid="n4"
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
        path.join("results", "copy_run_3", "data.csv"),
      ],
    ],
    // Test: 3 (connect source to triple input module)
    [
      [
        // Modules to add to scene
        "payload shell", // data-nodeid="n0"
        "copy run multiport", // data-nodeid="n1"
      ],
      [
        // Connections to make between modules
        ["n0-out-source", "n1-in1-target"], // (nodeid)-(portname)-(porttype)
      ],
      [
        // Expected output files
        path.join("results", "copy_run_multiport", "data.csv"),
      ],
    ],
  ])(
    "Build and Test the workflow: module '%s'",
    async (modulenames, connections, outfiles) => {
      // Open settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavSettings"]')).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(
        webdriver.By.id("inputBuilderSettingsSnakemakeArgs"),
      );
      await OverwriteInputField(args, "--cores 1");

      // Close settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavBuilder"]')).click();
      console.log("<<< test Set snakemake arguments list to use conda");

      // Build and run workflow
      await BuildAndRun_MultiModuleWorkflow(
        driver,
        modulenames,
        connections,
        outfiles,
      );
    },
    5 * ONE_MINUTE,
  ); // long timeout

  runif(!is_windows).each([
    [
      [
        // Modules to add to scene
        "payload run", // data-nodeid="n0"
        "copy run", // data-nodeid="n1"
      ],
      [
        // Connections to make between modules
        ["n0-out-source", "n1-in-target"], // (nodeid)-(portname)-(porttype)
      ],
      [
        // Expected output files
        path.join("results", "copy_run", "data.csv"),
      ],
    ],
  ])(
    "Parameter linkage",
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
      await driver.wait(until.elementLocated(By.id("btnBuilderValidate")));
      await driver.findElement(By.id("btnBuilderValidate")).click();
      let msg = await WaitForReturnCode(
        driver,
        "runner/check-node-dependencies",
      );
      expect(msg.returncode).toEqual(0); // 0 = success
      await driver.findElement(By.className("react-flow__pane")).click();

      // Build and run the workflow (should pass)
      await MultiModuleWorkflow_BuildAndCheck({
        driver: driver,
        target_files: target_files,
      });
      await MultiModuleWorkflow_TidyUp(driver, target_files);

      // Change the source filename (not yet linked to target module)
      await driver.findElement(By.xpath(`//div[@data-id="n0"]`)).click();
      await OverwriteInputField(
        await driver.findElement(webdriver.By.id("nodeinfo-n0-config-params-filename")),
        "newfile.csv"
      );

      // Validation check (should fail)
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderValidate")));
      await driver.findElement(By.id("btnBuilderValidate")).click();
      msg = await WaitForReturnCode(driver, "runner/check-node-dependencies");
      expect(msg.returncode).toEqual(1); // 1 = missing dependency

      // Build should fail
      await MultiModuleWorkflow_BuildAndCheck({
        driver: driver,
        target_files: target_files,
        should_fail: true,
      });
      await MultiModuleWorkflow_TidyUp(driver, target_files);
      await driver.findElement(By.className("react-flow__pane")).click();

      // Form parameter link between modules
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      const link_button = By.id("nodeinfo-n1-config-params-filename_link");
      await driver.wait(until.elementLocated(link_button), TEN_SECS);
      await driver.findElement(link_button).click();
      const link_target = By.xpath(
        `//div[@class='MuiTreeItem-label' and contains(text(), "filename")]`,
      );
      await driver.wait(until.elementLocated(link_target), TEN_SECS);
      await driver.findElement(link_target).click();
      await driver.findElement(By.id("btnParameterListClose")).click();
      await driver.findElement(By.className("react-flow__pane")).click();

      // Validation check (should pass)
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderValidate")));
      await driver.findElement(By.id("btnBuilderValidate")).click();
      msg = await WaitForReturnCode(driver, "runner/check-node-dependencies");
      expect(msg.returncode).toEqual(0); // 0 = success

      // Build and run the (linked) workflow (should pass)
      outfiles[0] = path.join(
        "results",
        "copy_run",
        "newfile.csv",
      );
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
      await driver.findElement(By.className("react-flow__pane")).click();

      // Delete the parameter link between modules
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(link_button), TEN_SECS);
      await driver.findElement(link_button).click();
      await driver.wait(
        until.elementLocated(By.id("btnParameterListRemove")),
        TEN_SECS,
      );
      await driver.findElement(By.id("btnParameterListRemove")).click();
      await driver.findElement(By.id("btnParameterListClose")).click();

      // Validation check (should fail - no need to test build again)
      await driver.findElement(By.xpath(`//div[@data-id="n1"]`)).click();
      await driver.wait(until.elementLocated(By.id("btnBuilderValidate")));
      await driver.findElement(By.id("btnBuilderValidate")).click();
      msg = await WaitForReturnCode(driver, "runner/check-node-dependencies");
      expect(msg.returncode).toEqual(1); // 1 = missing dependency
    },
    5 * ONE_MINUTE,
  );

  runif(is_installed(["mamba", "conda"], "any"))(
    "Set snakemake arguments list to use conda",
    async () => {
      console.log("::: test Set snakemake arguments list to use conda");
      // Open settings panel
      await driver.findElement(By.xpath('//div[@id="btnSidenavSettings"]')).click();

      // Set snakemake command line arguments
      const args = await driver.findElement(
        webdriver.By.id("inputBuilderSettingsSnakemakeArgs"),
      );
      await OverwriteInputField(args, "--cores 1 --use-conda");

      // Set conda environment path --- passthrough from test environment
      if (process.env.CONDA_PATH != undefined) {
        const args = await driver.findElement(
          webdriver.By.id("inputBuilderSettingsEnvironmentVars"),
        );
        await OverwriteInputField(args, `PATH=${process.env.CONDA_PATH}`);
      }

      // Close settings pane
      await driver.findElement(By.xpath('//div[@id="btnSidenavBuilder"]')).click();
      console.log("<<< test Set snakemake arguments list to use conda");
    },
  );

  // Conda tests
  runif(is_installed(["mamba", "conda"], "any")).each([
    [
      "conda",
      [path.join("results", "conda", "data.csv")],
    ],
  ])(
    "Build and Test the conda workflow: module '%s'",
    async (modulename, outfiles) => {
      await BuildAndRun_SingleModuleWorkflow(driver, modulename, outfiles);
    },
    10 * ONE_MINUTE,
  ); // long timeout

  // Container tests
  runif(run_container_tests && is_installed(["docker"])).each([
    [
      // NOTE: This test relies on the remote module jsbrittain/snakeshack (Utilty) touch
      "container_touch",
      [
        // target files
        path.join("results", "utility_touch", "data.csv"),
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
  runif(run_container_tests && is_installed(["docker"])).each([
    [
      "payload run",
      [
        // target files
        path.join("results", "payload_run", "data.csv"),
      ],
      [
        // packaged payload files
        path.join(
          "workflow",
          "modules",
          "local",
          "test-repo",
          "workflows",
          "single_modules",
          "sources",
          "payload_run",
          "resources",
          "file",
        ),
      ],
    ],
  ])(
    "Package workflow (container): module '%s'",
    async (modulename, target_files, payload_files) => {
      // Build and run workflow (packaged)
      console.log("::: Package workflow (container)");
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
