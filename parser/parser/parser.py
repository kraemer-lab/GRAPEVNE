import json

from .snakemake_parser import snakefile


def Build(data: dict) -> str:
    match data["format"]:
        case "Snakefile":
            build_data: str = snakefile.Build(json.loads(data["content"]))
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return build_data


def Lint(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            lint_response: dict = snakefile.Lint(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return lint_response


def Tokenize(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.SplitByRules(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return tokenized_data


def TokenizeLoad(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.SplitByRulesLocal(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return tokenized_data
