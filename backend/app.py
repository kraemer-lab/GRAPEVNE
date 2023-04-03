import json

import events
from flask import Flask
from flask import request
from flask import Response
from flask_cors import CORS
from flask_cors import cross_origin

app = Flask(__name__)
CORS(app)


@app.route("/api/post", methods=["POST"])
@cross_origin()
def post():
    try:
        app.logger.debug(f"POST request: {request.json}")
        match request.json["query"]:
            case "build":
                data = {
                    "query": request.json["query"],
                    "body": events.Build(request.json["data"]),
                }
            case "lint":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(events.Lint(request.json["data"])),
                }
            case "tokenize":
                data = {
                    "query": request.json["query"],
                    "body": json.dumps(events.Tokenize(request.json["data"])),
                }
            case _:
                return Response(
                    f"Query not supported: {request.json['query']}", status=400
                )
    except ValueError as err:
        # can be raised by events module (provided with invalid file format)
        app.logger.error(err)
        return Response(err, status=400)
    except TypeError as err:
        app.logger.error(err)
        return Response("Server error", status=500)
    return json.dumps(data)


@app.route("/")
def main() -> str:
    return "<p>Phyloflow flask server is running</p>"
