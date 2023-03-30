from flask import Response
from parser.parser import Snakefile_Build
from parser.parser import Snakefile_Lint
from parser.parser import Snakefile_SplitByRules
import json


def Tokenize(data):
    match data["format"]:
        case "Snakefile":
            tokenized_data = Snakefile_SplitByRules(data["content"])
        case _:
            return Response(
                f"Tokenize format not supported: {data['format']}", status=400
            )
    return tokenized_data


def Build(data):
    match data["format"]:
        case "Snakefile":
            build_data = Snakefile_Build(json.loads(data["content"]))
        case _:
            return Response(f"Build format not supported: {data['format']}", status=400)
    return build_data


def Lint(data):
    match data["format"]:
        case "Snakefile":
            lint_response = Snakefile_Lint(data["content"])
        case _:
            return Response(
                f"Linting format not supported: {data['format']}", status=400
            )
    return lint_response
