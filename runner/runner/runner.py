import json

from .snakemake_runner import snakefile


def Build(data: dict) -> str:
    """Builds a workflow from a JSON object."""
    match data["format"]:
        case "Snakefile":
            build_data: str = snakefile.Build(json.loads(data["content"]))
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return build_data


def DeleteAllOutput(data: dict) -> dict:
    """Deletes all output files from a workflow."""
    match data["format"]:
        case "Snakefile":
            del_data: dict = snakefile.DeleteAllOutput(data["content"])
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return del_data


def Lint(data: dict) -> dict:
    """Lints a workflow given a directory location."""
    match data["format"]:
        case "Snakefile":
            lint_response: dict = snakefile.LintContents(data["content"])
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return lint_response


def LintContents(data: dict) -> dict:
    """Lints a workflow given a Snakefile as string."""
    match data["format"]:
        case "Snakefile":
            build_data: str = snakefile.Build(json.loads(data["content"]))
            lint_response: dict = snakefile.LintContents(build_data)
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return lint_response


def Launch(data: dict) -> dict:
    """Launches a workflow in a given location."""
    match data["format"]:
        case "Snakefile":
            launch_response: dict = snakefile.Launch(data["content"])
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return launch_response


def Tokenize(data: dict) -> dict:
    """Tokenizes a workflow given a Snakefile as string."""
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.SplitByRulesFileContent(data["content"])
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return tokenized_data


def LoadWorkflow(data: dict) -> dict:
    """Tokenizes a workflow and returns rule/module nodes."""
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.LoadWorkflow(data["content"])
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return tokenized_data


def TokenizeFromFile(data: dict) -> dict:
    """Tokenizes a workflow given a workflow location."""
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.LoadWorkflow(data["content"])
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return tokenized_data


def FullTokenizeFromFile(data: dict) -> dict:
    """Creates a working copy of the Snakefile and tokenizes."""
    match data["format"]:
        case "Snakefile":
            tokenized_data: dict = snakefile.FullTokenizeFromFile(data["content"])
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return tokenized_data


def CheckNodeDependencies(data: dict) -> dict:
    """Checks the dependencies of a node, given the node and first-order inputs."""
    match data["format"]:
        case "Snakefile":
            js = json.loads(data["content"])
            response: dict = snakefile.CheckNodeDependencies(js)
        case _:
            raise ValueError(f"Format not supported: {data['format']}")
    return response
