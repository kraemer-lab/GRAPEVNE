import base64
import json

import filesystem
from flask import Flask
from flask import request
from flask import Response
from flask_cors import CORS
from flask_cors import cross_origin

import builder
import runner

app = Flask(__name__)
CORS(app)


@app.route("/api/post", methods=["POST"])
@cross_origin()
def post():
    """Handles POST requests from the frontend."""
    try:
        app.logger.debug(f"POST request: {request.json}")
        match request.json["query"]:
            # File system queries
            case "display/folderinfo":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(filesystem.GetFolderItems(request.json["data"])),
                }

            # Builder queries
            case "builder/compile-to-json":
                data = request.json["data"]
                js = json.loads(data["content"])
                with open(
                    "workflow.json", "w"
                ) as f:  # dump config file to disk for debug
                    json.dump(js, f, indent=4)
                memory_zip, _ = builder.BuildFromJSON(js)
                return Response(
                    base64.b64encode(memory_zip),
                    mimetype="application/zip",
                    headers={"Content-Disposition": "attachment;filename=workflow.zip"},
                )
            case "builder/get-remote-modules":
                data = request.json["data"]
                js = json.loads(data["content"])
                data = {
                    "query": request.json["query"],
                    "body": builder.GetModulesList(js["url"]),
                }

            # Runner queries
            case "runner/build":
                data = {
                    "query": request.json["query"],
                    "body": runner.Build(request.json["data"]),
                }
            case "runner/deleteresults":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(runner.DeleteAllOutput(request.json["data"])),
                }
            case "runner/lint":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(runner.LintContents(request.json["data"])),
                }
            case "runner/loadworkflow":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(runner.LoadWorkflow(request.json["data"])),
                }
            case "runner/tokenize":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(runner.Tokenize(request.json["data"])),
                }
            case "runner/tokenize_load":
                try:
                    # Try full-tokenize (may fail if dependencies not present)
                    body = runner.FullTokenizeFromFile(request.json["data"])
                except BaseException:
                    # ...then try in-situ tokenization
                    body = runner.TokenizeFromFile(request.json["data"])
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(body),
                }
            case "runner/jobstatus":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(runner.TokenizeFromFile(request.json["data"])),
                }
            case "runner/launch":
                app.logger.debug(f"Data: {request.json['data']}")
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(runner.Launch(request.json["data"])),
                }
            case "runner/check-node-dependencies":
                data = {
                    "query": request.json["query"],
                    "body": runner.CheckNodeDependencies(request.json["data"]),
                }

            case _:
                return Response(
                    f"Query not supported: {request.json['query']}", status=400
                )
    except ValueError as err:
        # can be raised by runner module (provided with invalid file format)
        app.logger.error(err)
        return Response(err, status=400)
    except TypeError as err:
        app.logger.error(err)
        return Response("Server error", status=500)
    return json.dumps(data)


@app.route("/")
def main() -> str:
    """Returns a simple message to indicate that the server is running."""
    return "<p>Phyloflow flask server is running</p>"
