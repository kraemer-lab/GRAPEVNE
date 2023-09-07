import * as fs from "fs";
import * as path from "path";
import assert from "assert";
import handles from "./handles";

const test_BuildAndRun_FromRemote = async (sendPtyData: any) => {
  const rtn_CleanBuildFolder = await handles.builder_CleanBuildFolder(
    null,
    {
      query: "builder/clean-build-folder",
      data: { format: "Snakefile", content: { path: "" } },
    },
    (data: string) => sendPtyData(data + "\r\n")
  );
  console.log(rtn_CleanBuildFolder);

  const query = {
    query: "builder/build-and-run",
    data: {
      format: "Snakefile",
      content: [
        {
          id: "idcode",
          name: "(TutorialBuilder) Download",
          type: "source",
          config: {
            snakefile: {
              function: "github",
              args: ["kraemer-lab/vneyard"],
              kwargs: {
                path: "workflows/TutorialBuilder/sources/Download/workflow/Snakefile",
                branch: "main",
              },
            },
            config: {
              input_namespace: null,
              output_namespace: "out",
              params: {
                url: "https://covid19.who.int/WHO-COVID-19-global-data.csv",
                filename: "data.csv",
              },
            },
          },
        },
        {
          id: "idcode",
          name: "(TutorialBuilder) AggregateByMonth",
          type: "module",
          config: {
            snakefile: {
              function: "github",
              args: ["kraemer-lab/vneyard"],
              kwargs: {
                path: "workflows/TutorialBuilder/modules/AggregateByMonth/workflow/Snakefile",
                branch: "main",
              },
            },
            config: {
              input_namespace: "in",
              output_namespace: "out",
              params: {
                Source: "data.csv",
                DateColumn: "Date_reported",
                Columns: [
                  "New_cases",
                  "Cumulative_cases",
                  "New_deaths",
                  "Cumulative_deaths",
                ],
              },
            },
          },
        },
        {
          name: "Join [(TutorialBuilder) AggregateByMonth]",
          type: "connector",
          config: {
            map: [
              "(TutorialBuilder) Download",
              "(TutorialBuilder) AggregateByMonth",
            ],
          },
        },
      ],
      targets: ["(TutorialBuilder) AggregateByMonth"],
      args: "--cores 1 --use-conda",
      backend: "builtin",
      conda_backend: "builtin",
      environment_variables: "",
    },
  };

  /*query: "builder/build-and-run",
    data: {
      {
    }
    data: {
      format: "Snakefile",
      content: [
        {
          id: "idcode",
          name: "(TutorialBuilder) Download",
          type: "source",
          config: {
            snakefile: {
              function: "github",
              args: ["kraemer-lab/vneyard"],
              kwargs: {
                path: "workflows/TutorialBuilder/sources/Download/workflow/Snakefile",
                branch: "main",
              },
            },
            config: {
              input_namespace: null,
              output_namespace: "out",
              params: {
                // url: "https://snakemake.github.io/img/jk/logo.png",
                url: "https://covid19.who.int/WHO-COVID-19-global-data.csv",
                // filename: "snakemake.png",
                filename: "data.csv",
              },
            },
          },
        },
      ],
      targets: ["(TutorialBuilder) Download"],
      args: "--cores 1 --use-conda",
      backend: "builtin",
      conda_backend: "builtin",
      environment_variables: "",
    },
  };*/
  await handles
    .builder_BuildAndRun(
      null,
      query,
      (data: string) => sendPtyData(data + "\r\n"), // terminal_sendLine,
      (data: string) => sendPtyData(data + "\r\n"),
      (data: string) => sendPtyData(data + "\r\n")
    )
    .then((rtn: any) => {
      console.log(rtn);
      const workdir = rtn["body"]["workdir"];
      assert(workdir !== undefined);
      let downloaded_filename = path.join(
        workdir,
        "results",
        "tutorialbuilder_download",
        "data.csv"
      );
      assert(fs.existsSync(downloaded_filename));
      downloaded_filename = path.join(
        workdir,
        "results",
        "tutorialbuilder_aggregatebymonth",
        "data.csv"
      );
      assert(fs.existsSync(downloaded_filename));
    });
};

const testsuite = async (sendPtyData: any) => {
  console.log("Running test suite...");
  await test_BuildAndRun_FromRemote(sendPtyData);
};

export default testsuite;
