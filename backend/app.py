import json

import filesystem
from flask import Flask
from flask import request
from flask import Response
from flask_cors import CORS
from flask_cors import cross_origin

import parser

app = Flask(__name__)
CORS(app)


@app.route("/api/post", methods=["POST"])
@cross_origin()
def post():
    try:
        app.logger.debug(f"POST request: {request.json}")
        match request.json["query"]:
            # File system queries
            case "folderinfo":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(filesystem.GetFolderItems(request.json["data"])),
                }

            # Parser queries
            case "build":
                data = {
                    "query": request.json["query"],
                    "body": parser.Build(request.json["data"]),
                }
            case "deleteresults":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(parser.DeleteAllOutput(request.json["data"])),
                }
            case "lint":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(parser.LintContents(request.json["data"])),
                }
            case "loadworkflow":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(parser.LoadWorkflow(request.json["data"])),
                }
            case "tokenize":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(parser.Tokenize(request.json["data"])),
                }
            case "tokenize_load":
                try:
                    # Try full-tokenize (may fail if dependencies not present)
                    body = parser.FullTokenizeFromFile(request.json["data"])
                except BaseException:
                    # ...then try in-situ tokenization
                    body = parser.TokenizeFromFile(request.json["data"])
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(body),
                }
            case "jobstatus":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(parser.TokenizeFromFile(request.json["data"])),
                }
            case "launch":
                app.logger.debug(f"Data: {request.json['data']}")
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(parser.Launch(request.json["data"])),
                }
            case _:
                return Response(
                    f"Query not supported: {request.json['query']}", status=400
                )
    except ValueError as err:
        # can be raised by parser module (provided with invalid file format)
        app.logger.error(err)
        return Response(err, status=400)
    except TypeError as err:
        app.logger.error(err)
        return Response("Server error", status=500)
    return json.dumps(data)


@app.route("/")
def main() -> str:
    return "<p>Phyloflow flask server is running</p>"
