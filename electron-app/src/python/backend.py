import contextlib
import json
import logging
import os
import sys
import tempfile

import filesystem

import builder
import runner


default_build_path = tempfile.gettempdir() + "/workflows/build"
default_testbuild_path = tempfile.gettempdir() + "/workflows/testbuild"
logfile = os.path.expanduser("~") + "/GRAPEVNE.log"

# Set up logging
logging.basicConfig(
    filename=logfile,
    encoding="utf-8",
    level=logging.DEBUG,
)
logging.info("Working directory: %s", os.getcwd())


def post(request):
    """Handles POST requests from the frontend."""
    request_js = json.loads(request)
    query = request_js["query"]
    data = request_js["data"]

    logging.info("Received query: %s", query)
    logging.info("Received data: %s", data)

    if query == "runner/snakemake-run":
        # Special query - does not capture stdout, stderr
        runner.SnakemakeRun(data)
        return None

    # Suppress stdout as we only want to control the return data from this
    # PyInstaller executable which is called from electron.
    with contextlib.redirect_stdout(None):
        # File system queries
        if query == "display/folderinfo":
            data = {
                "query": query,
                "body": json.dumps(filesystem.GetFolderItems(data)),
            }

        # Builder queries
        elif query == "builder/compile-to-json":
            js = data["content"]
            # with open(default_build_path + "/workflow.json", "w") as f:  # dump config file to disk for debug
            #     json.dump(js, f, indent=4)
            memory_zip, _, zipfilename = builder.BuildFromJSON(
                js,
                build_path=default_build_path,
            )
            # Binary return is not used when passing the information over stdout.
            # Instead, the zip file is read back off the disk and forwarded by
            # electron / nodejs.
            data = {
                "query": query,
                "body": {
                    "zipfile": zipfilename,
                },
            }
        elif query == "builder/build-and-run":
            # First, build the workflow
            logging.info("Building workflow")
            js = data["content"]
            # with open("workflow.json", "w") as f:  # dump config file to disk for debug
            #     json.dump(js, f, indent=4)
            build_path = default_testbuild_path
            logging.info("BuildFromJSON")
            memory_zip, m, _ = builder.BuildFromJSON(
                js,
                build_path=build_path,
                clean_build=False,  # Do not overwrite existing build
                create_zip=False,
            )
            targets = data.get("targets", [])
            target_modules = m.LookupRuleNames(targets)

            # Get list of snakemake rules, cross-reference with target_modules
            # and select 'target' or all rules, then pass on to command
            data_list = runner.Launch_cmd(
                {
                    "format": data["format"],
                    "content": build_path,
                    "args": "--list",
                },
                terminal=False,
            )
            # Stringify command
            data_list["command"] = " ".join(data_list["command"])
            logging.info("List command: %s", data_list["command"])
            response = runner.SnakemakeRun(
                {
                    "format": data["format"],
                    "content": {
                        "command": data_list["command"],
                        "workdir": data_list["workdir"],
                        "capture_output": True,
                        "backend": data.get("backend", ""),
                    },
                }
            )
            snakemake_list = response["stdout"].split("\n")
            logging.debug("snakemake --list output: %s", snakemake_list)
            target_rules = []
            for target in target_modules:
                target_rule = f"{target}_target"
                if target_rule in snakemake_list:
                    target_rules.append(target_rule)
                else:
                    target_rules.extend(
                        [
                            rulename
                            for rulename in snakemake_list
                            if rulename.startswith(target)
                        ]
                    )

            # Second, return the launch command
            logging.info("Generating launch command")
            data = runner.Launch_cmd(
                {
                    "format": data["format"],
                    "content": build_path,
                    "targets": target_rules,
                    "args": data.get("args", ""),
                },
                terminal=False,
            )
            # Stringify command
            data["command"] = " ".join(data["command"])
            logging.info("Launch command: %s", data["command"])
            # Return the launch command
            data = {
                "query": query,
                "body": data,
            }
        elif query == "builder/clean-build-folder":
            data = {
                "query": query,
                "body": builder.CleanBuildFolder(default_testbuild_path),
            }
        elif query == "builder/get-remote-modules":
            js = data["content"]
            data = {
                "query": query,
                "body": builder.GetModulesList(js["url"]),
            }

        # Runner queries
        elif query == "runner/build":
            data = {
                "query": query,
                "body": runner.Build(data),
            }
        elif query == "runner/deleteresults":
            data = {
                "query": query,
                "body": json.dumps(runner.DeleteAllOutput(data)),
            }
        elif query == "runner/lint":
            data = {
                "query": query,
                "body": json.dumps(runner.LintContents(data)),
            }
        elif query == "runner/loadworkflow":
            data = {
                "query": query,
                "body": json.dumps(runner.LoadWorkflow(data)),
            }
        elif query == "runner/tokenize":
            data = {
                "query": query,
                "body": json.dumps(runner.Tokenize(data)),
            }
        elif query == "runner/tokenize_load":
            try:
                # Try full-tokenize (may fail if dependencies not present)
                body = runner.FullTokenizeFromFile(data)
            except BaseException:
                # ...then try in-situ tokenization
                body = runner.TokenizeFromFile(data)
            data = {
                "query": query,
                "body": json.dumps(body),
            }
        elif query == "runner/jobstatus":
            data = {
                "query": query,
                "body": json.dumps(runner.TokenizeFromFile(data)),
            }
        elif query == "runner/launch":
            data = {
                "query": query,
                "body": json.dumps(runner.Launch(data)),
            }
        elif query == "runner/check-node-dependencies":
            data = {
                "query": query,
                "body": runner.CheckNodeDependencies(data),
            }

        else:
            raise NotImplementedError(f"Unknown query: {query}")

    # Return via stdout
    rtn = json.dumps(data)
    print(rtn)
    logging.info("Query response: %s", rtn)


post(sys.argv[1])
