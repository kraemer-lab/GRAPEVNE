import json

from .snakemake_parser import snakefile


def Build(data: dict) -> str:
    match data["format"]:
        case "Snakefile":
            build_data: str = snakefile.Build(json.loads(data["content"]))
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return build_data


def DeleteAllOutput(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            del_data: dict = snakefile.DeleteAllOutput(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return del_data


def Lint(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            lint_response: dict = snakefile.LintContents(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return lint_response


def LintContents(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            build_data: str = snakefile.Build(json.loads(data["content"]))
            lint_response: dict = snakefile.LintContents(build_data)
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return lint_response


def Launch(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            launch_response: dict = snakefile.Launch(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return launch_response


def Tokenize(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.SplitByRulesFileContent(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return tokenized_data


def LoadWorkflow(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.LoadWorkflow(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return tokenized_data


def TokenizeFromFile(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.LoadWorkflow(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return tokenized_data


def FullTokenizeFromFile(data: dict) -> dict:
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.FullTokenizeFromFile(data["content"])
        case _:
            raise ValueError("Format not supported: {data['format']}")
    return tokenized_data
