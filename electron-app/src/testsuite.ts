import * as fs from "fs";
import * as path from "path";
import assert from "assert";
import handles from "./handles";

const test_BuildAndRun_FromRemote = async (sendPtyData: any) => {
  const rtn_CleanBuildFolder = await handles.builder_CleanBuildFolder(
    null,
    {"query":"builder/clean-build-folder","data":{"format":"Snakefile","content":{"path":""}}},
    (data: string) => sendPtyData(data + "\r\n"),
  );
  console.log(rtn_CleanBuildFolder);

  const query = {
    "query": "builder/build-and-run",
    "data": {
      "format":"Snakefile",
      "content": [
        {
          "id": "idcode",
          "name": "(TutorialBuilder) Download",
          "type":"source",
          "config": {
            "snakefile": {
              "function": "github",
              "args": ["kraemer-lab/vneyard"],
              "kwargs": {
                "path": "workflows/TutorialBuilder/sources/Download/workflow/Snakefile",
                "branch": "main"
              }
            },
            "config": {
              "input_namespace": null,
              "output_namespace": "out",
              "params": {
                "url": "https://snakemake.github.io/img/jk/logo.png",
                "filename": "snakemake.png"
              }
            }
          }
        }
      ],
      "targets": [
        "(TutorialBuilder) Download"
      ],
      "args": "--cores 1 --use-conda",
      "backend": "builtin"
    }
  };
  await handles.builder_BuildAndRun(
    null,
    query,
    (data: string) => sendPtyData(data + "\r\n"), // terminal_sendLine,
    (data: string) => sendPtyData(data + "\r\n"),
    (data: string) => sendPtyData(data + "\r\n")
  ).then((rtn: any) => {
    console.log(rtn);
    const workdir = rtn['body']['workdir'];
    assert(workdir !== undefined);
    const downloaded_filename = path.join(workdir, "results", "tutorialbuilder_download", "snakemake.png");
    assert(fs.existsSync(downloaded_filename));
  });
};

const testsuite = async (sendPtyData: any) => {
  console.log("Running test suite...");
  await test_BuildAndRun_FromRemote(sendPtyData);
}

export default testsuite;
