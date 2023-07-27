# import base64
import contextlib
import json
import sys

import filesystem

import builder
import runner


default_build_path = "workflows/build"
default_testbuild_path = "workflows/testbuild"


def post(request):
    """Handles POST requests from the frontend."""
    request_js = json.loads(request)
    query = request_js["query"]
    data = request_js["data"]

    # File system queries
    if query == "display/folderinfo":
        data = {
            "query": query,
            "body": json.dumps(filesystem.GetFolderItems(data)),
        }

    # Builder queries
    elif query == "builder/compile-to-json":
        js = data["content"]
        with open("workflow.json", "w") as f:  # dump config file to disk for debug
            json.dump(js, f, indent=4)
        memory_zip, _ = builder.BuildFromJSON(js, build_path=default_build_path)
        # Binary return is not used when passing the information over stdout.
        # Instead, the zip file is read back off the disk and forwarded by
        # electron / nodejs.
        data = {
            "query": query,
            "body": "",
        }
    elif query == "builder/build-and-run":
        # First, build the workflow
        js = data["content"]
        with open("workflow.json", "w") as f:  # dump config file to disk for debug
            json.dump(js, f, indent=4)
        build_path = default_testbuild_path
        memory_zip, _ = builder.BuildFromJSON(
            js,
            build_path=build_path,
            clean_build=False,  # Do not overwrite existing build
        )
        # Second, launch the workflow in a window
        data = {
            "query": query,
            "body": runner.Launch(
                {
                    "format": data["format"],
                    "content": build_path,
                },
                terminal=True,
            ),
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

    return json.dumps(data)


# Suppress stdout to prevent it being returned through python-shell
# which is called from electron. This entire interface layer is only
# required while the backend code is written in Python.
with contextlib.redirect_stdout(None):
    rtn = post(sys.argv[1])
print(rtn)
