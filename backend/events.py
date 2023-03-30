from parser.parser import Snakefile_Build
from parser.parser import Snakefile_Lint
from parser.parser import Snakefile_SplitByRules
import json


def Tokenize(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = Snakefile_SplitByRules(data["content"])
        case _:
            return {}
            raise ValueError("Format not supported: {data['format']}")
    return tokenized_data


def Build(data: dict) -> str:
    match data["format"]:
        case "Snakefile":
            build_data: str = Snakefile_Build(json.loads(data["content"]))
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return build_data


def Lint(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            build_data: str = Snakefile_Build(json.loads(data["content"]))
            lint_response: dict = Snakefile_Lint(build_data)
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return lint_response
