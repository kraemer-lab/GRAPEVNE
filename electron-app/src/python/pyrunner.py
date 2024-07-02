import contextlib
import json
import logging
import os
import sys
import tempfile
from typing import List
from zipfile import ZipFile
from zipfile import ZipInfo

import filesystem
import snakemake

import builder
import runner


shell_launch = "#!/usr/bin/env bash"
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


def BuildAndRun(
    data: dict,
    build_path: str,
    clean_build=True,
    create_zip=True,
    containerize=False,
    create_launch_script=False,
):
    # Validate inputs
    create_launch_script |= containerize
    # First, build the workflow
    logging.info("Building workflow")
    js = data["content"]
    logging.info("BuildFromJSON")
    _, m, zipfilename = builder.BuildFromJSON(
        js,
        build_path=build_path,
        clean_build=clean_build,  # clean build folder before build
        create_zip=create_zip,  # create zip file
        package_modules=data.get("package_modules", False),  # package modules
        workflow_alerts=data.get("workflow_alerts", {}),  # workflow alerts
    )
    targets = data.get("targets", [])
    target_modules = m.LookupRuleNames(targets)
    logging.debug("target module (rulenames): %s", target_modules)

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
    snakemake_list: List[str] = list(filter(None, response["stdout"].split("\n")))
    logging.debug("snakemake --list output: %s", snakemake_list)
    logging.debug(f"target_modules: {target_modules}")
    target_rules = []
    for target in target_modules:
        if not target:
            # No equivalent rulename found, target is (presumably) a
            # module containing sub-modules
            ...
            raise NotImplementedError(
                "Cannot determine target rulenames for module containing sub-modules"
            )
        target_rule = f"{target}_all"
        if target_rule in snakemake_list:
            target_rules.append(target_rule)
            continue
        target_rule = f"{target}_target"
        if target_rule in snakemake_list:
            target_rules.append(target_rule)
            continue
        # Add the first rule to appear in the list (mimics snakemake behaviour)
        try:
            target_rules.append(
                next(
                    rulename
                    for rulename in snakemake_list
                    if rulename.startswith(target)
                )
            )
        except StopIteration:
            raise ValueError(f"Cannot determine target rule for module: {target}")

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
    # Add target script to zipfile
    if create_zip:
        if create_launch_script:
            logging.info("Adding target script to zipfile")
            # Add launch script (first, strip path from launch command)
            launch_command = data["command"].replace(build_path + "/", "")
            # Ensure --use-conda is set when building containers
            if "--use-conda" not in launch_command:
                launch_command_list = launch_command.split(" ")
                launch_command_list.insert(1, "--use-conda")
                launch_command = " ".join(launch_command_list)
            # Write launch script to zip
            with ZipFile(zipfilename, "a") as zipfile:
                info = ZipInfo("run.sh")
                info.external_attr = 0o0100777 << 16  # give rwx permissions
                zipfile.writestr(info, shell_launch + "\n\n" + launch_command)
            # Add container files to zip
            if containerize:
                # Read Dockerfile and launch script templates
                with open(
                    os.path.join(os.path.dirname(__file__), "Dockerfile"), "r"
                ) as f:
                    Dockerfile = f.read()
                with open(
                    os.path.join(os.path.dirname(__file__), "build_container_sh"), "r"
                ) as f:
                    docker_build_container = f.read()
                with open(
                    os.path.join(os.path.dirname(__file__), "launch_container_sh"), "r"
                ) as f:
                    docker_launch_container = f.read()
                # Write Dockerfile and launch script to zip
                with ZipFile(zipfilename, "a") as zipfile:
                    # Build container
                    zipfile.writestr(
                        "Dockerfile",
                        Dockerfile.replace(
                            "$(snakemake --list)",
                            " ".join(target_rules),
                        ),
                    )
                    # Build container
                    info = ZipInfo("build_container.sh")
                    info.external_attr = 0o0100777 << 16  # give rwx permissions
                    zipfile.writestr(
                        info,
                        docker_build_container.replace(
                            "#!/usr/bin/env bash", shell_launch
                        ).replace(
                            "$(snakemake --list)",
                            " ".join(target_rules),
                        ),
                    )
                    # Launch workflow
                    info = ZipInfo("launch_container.sh")
                    info.external_attr = 0o0100777 << 16  # give rwx permissions
                    zipfile.writestr(
                        info,
                        docker_launch_container.replace(
                            "#!/usr/bin/env bash", shell_launch
                        ),
                    )
        data["zipfile"] = zipfilename
    return data


def post(request):
    """Handles POST requests from the frontend."""
    logging.debug("Received request: %s", request)
    try:
        request_js = json.loads(request)
    except json.decoder.JSONDecodeError as e:
        logging.error("JSONDecodeError: %s", e)
        logging.error("Received query not in proper JSON format")
        return None
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
        elif query == "builder/build-as-module":
            data = {
                "query": query,
                "body": BuildAndRun(
                    data,
                    default_build_path,
                    clean_build=True,
                    create_zip=True,
                    containerize=False,
                ),
                "returncode": 0,
            }
        elif query == "builder/build-as-workflow":
            data = {
                "query": query,
                "body": BuildAndRun(
                    data,
                    default_build_path,
                    clean_build=True,
                    create_zip=True,
                    containerize=True,
                ),
                "returncode": 0,
            }
        elif query == "builder/build-and-run":
            data = {
                "query": query,
                "body": BuildAndRun(
                    data,
                    default_testbuild_path,
                    clean_build=False,
                    create_zip=False,
                    containerize=False,
                ),
                "returncode": 0,
            }
        elif query == "builder/clean-build-folder":
            data = {
                "query": query,
                "body": {
                    "path": default_testbuild_path,
                },
                "returncode": builder.CleanBuildFolder(default_testbuild_path),
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
                "returncode": 0,
            }

        else:
            raise NotImplementedError(f"Unknown query: {query}")

    # Return via stdout
    logging.debug("Query: %s", query)
    logging.debug("Query response: %s", data)
    rtn = json.dumps(data)
    print(rtn)
    logging.info("Query response: %s", rtn)


logging.debug("sys.argv: %s", sys.argv)
if len(sys.argv) > 2:
    # TODO: Somewhere, somehow, snakemake is calling this executable with a
    #       parameter set. This is a temporary hack to get around that until
    #       the calling function can be redirected.
    logging.debug("snakemake: %s", sys.argv[3:])
    snakemake.main(" ".join(sys.argv[3:]))
else:
    post(sys.argv[1])
