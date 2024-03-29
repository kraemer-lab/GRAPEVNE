import json

from .snakemake_runner import snakefile


def Build(data: dict) -> str:
    """Builds a workflow from a JSON object."""
    if data["format"] == "Snakefile":
        build_data: str = snakefile.Build(json.loads(data["content"]))
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return build_data


def DeleteAllOutput(data: dict) -> dict:
    """Deletes all output files from a workflow."""
    if data["format"] == "Snakefile":
        del_data: dict = snakefile.DeleteAllOutput(data["content"])
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return del_data


def Lint(data: dict) -> dict:
    """Lints a workflow given a directory location."""
    if data["format"] == "Snakefile":
        lint_response: dict = snakefile.LintContents(data["content"])
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return lint_response


def LintContents(data: dict) -> dict:
    """Lints a workflow given a Snakefile as string."""
    if data["format"] == "Snakefile":
        build_data: str = snakefile.Build(json.loads(data["content"]))
        lint_response: dict = snakefile.LintContents(build_data)
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return lint_response


def Launch(data: dict, **kwargs) -> dict:
    """Launches a workflow in a given location."""
    if data["format"] == "Snakefile":
        launch_response: dict = snakefile.Launch(data["content"], **kwargs)
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return launch_response


def Launch_cmd(data: dict, *args, **kwargs) -> dict:
    """Returns the launch command for a workflow"""
    if data["format"] == "Snakefile":
        snakemake_args = data.get("args", "").split(" ")
        args = *args, *data.get("targets", [])
        cmd, workdir = snakefile.Launch_cmd(
            data["content"],
            *snakemake_args,
            *args,
            **kwargs,
        )
        launch_response: dict = {"command": cmd, "workdir": workdir}
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return launch_response


def Tokenize(data: dict) -> dict:
    """Tokenizes a workflow given a Snakefile as string."""
    if data["format"] == "Snakefile":
        tokenized_data: dict = snakefile.SplitByRulesFileContent(data["content"])
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return tokenized_data


def LoadWorkflow(data: dict) -> dict:
    """Tokenizes a workflow and returns rule/module nodes."""
    if data["format"] == "Snakefile":
        tokenized_data: dict = snakefile.LoadWorkflow(data["content"])
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return tokenized_data


def TokenizeFromFile(data: dict) -> dict:
    """Tokenizes a workflow given a workflow location."""
    if data["format"] == "Snakefile":
        tokenized_data: dict = snakefile.LoadWorkflow(data["content"])
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return tokenized_data


def FullTokenizeFromFile(data: dict) -> dict:
    """Creates a working copy of the Snakefile and tokenizes."""
    if data["format"] == "Snakefile":
        tokenized_data: dict = snakefile.FullTokenizeFromFile(data["content"])
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return tokenized_data


def CheckNodeDependencies(data: dict) -> dict:
    """Checks the dependencies of a node, given the node and first-order inputs."""
    if data["format"] == "Snakefile":
        js = json.loads(data["content"])
        snakemake_launcher = data.get("backend", "")
        response: dict = snakefile.CheckNodeDependencies(
            js,
            snakemake_launcher,
        )
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return response


def SnakemakeRun(data: dict) -> dict:
    """Run snakemake using a customised snakemake package import"""
    if data["format"] == "Snakefile":
        capture_output = data["content"].get("capture_output", False)
        stdout, stderr = snakefile.snakemake_run(
            data["content"]["command"].split(" "),
            data["content"]["workdir"],
            capture_output=capture_output,
            snakemake_launcher=data["content"].get("backend", ""),
        )
        response = {
            "stdout": stdout,
            "stderr": stderr,
        }
    else:
        raise ValueError(f"Format not supported: {data['format']}")
    return response
