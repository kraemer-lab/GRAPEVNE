# import base64
import contextlib
import json
import sys

import filesystem

import builder
import runner


def post(request):
    """Handles POST requests from the frontend."""
    request_js = json.loads(request)
    query = request_js["query"]
    data = request_js["data"]
    match query:
        # File system queries
        case "display/folderinfo":
            data = {
                "query": query,
                "body": json.dumps(filesystem.GetFolderItems(data)),
            }

        # Builder queries
        case "builder/compile-to-json":
            js = data["content"]
            with open("workflow.json", "w") as f:  # dump config file to disk for debug
                json.dump(js, f, indent=4)
            memory_zip, _ = builder.BuildFromJSON(js)
            return {}
            # TODO:
            # return Response(
            #     base64.b64encode(memory_zip),
            #     mimetype="application/zip",
            #     headers={"Content-Disposition": "attachment;filename=workflow.zip"},
            # )
        case "builder/get-remote-modules":
            js = data["content"]
            data = {
                "query": query,
                "body": builder.GetModulesList(js["url"]),
            }

        # Runner queries
        case "runner/build":
            data = {
                "query": query,
                "body": runner.Build(data),
            }
        case "runner/deleteresults":
            data = {
                "query": query,
                "body": json.dumps(runner.DeleteAllOutput(data)),
            }
        case "runner/lint":
            data = {
                "query": query,
                "body": json.dumps(runner.LintContents(data)),
            }
        case "runner/loadworkflow":
            data = {
                "query": query,
                "body": json.dumps(runner.LoadWorkflow(data)),
            }
        case "runner/tokenize":
            data = {
                "query": query,
                "body": json.dumps(runner.Tokenize(data)),
            }
        case "runner/tokenize_load":
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
        case "runner/jobstatus":
            data = {
                "query": query,
                "body": json.dumps(runner.TokenizeFromFile(data)),
            }
        case "runner/launch":
            data = {
                "query": query,
                "body": json.dumps(runner.Launch(data)),
            }
        case "runner/check-node-dependencies":
            data = {
                "query": query,
                "body": runner.CheckNodeDependencies(data),
            }

        case _:
            raise NotImplementedError(f"Unknown query: {query}")
    return json.dumps(data)


# Suppress stdout to prevent it being returned through python-shell
# which is called from electron. This entire interface layer is only
# required while the backend code is written in Python.
with contextlib.redirect_stdout(None):
    rtn = post(sys.argv[1])
print(rtn)
