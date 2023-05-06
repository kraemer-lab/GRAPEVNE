import contextlib
import json
import os
import shutil
import subprocess
import tempfile
from typing import Dict
from typing import List
from typing import Tuple

from parser.TokenizeFile import TokenizeFile


# ##############################################################################
# Queries
# ##############################################################################


def Build(data: dict) -> str:
    """Build Snakefile out of structured [dict] data"""
    contents: str = ""
    for block in data["block"]:
        contents += block["content"] + "\n"
    return contents


def DeleteAllOutput(filename: str) -> dict:
    """Ask snakemake to remove all output files"""
    filename, workdir = GetFileAndWorkingDirectory(filename)
    stdout, stderr = snakemake(
        filename,
        "--delete-all-output",
        workdir=workdir,
    )
    return {
        "status": "ok" if not stderr else "error",
        "content": {"stdout": stdout, "stderr": stderr},
    }


def Launch(filename: str) -> dict:
    """Launch snakemake workflow based upon provided [locally accessible] Snakefile"""
    filename, workdir = GetFileAndWorkingDirectory(filename)
    stdout, stderr = snakemake(
        filename, "--nolock",
        workdir=workdir,
    )
    return {
        "status": "ok" if not stderr else "error",
        "content": {"stdout": stdout, "stderr": stderr},
    }


def Lint(snakefile: str) -> dict:
    """Lint the Snakefile using the snakemake library, returns JSON"""
    try:
        stdout, stderr = snakemake(snakefile, "--lint", "json")
    except BaseException as e:
        return {"error": str(e)}
    # strip first and last lines as needed (snakemake returns)
    sl = stdout.split("\n")
    if sl[0] in {"True", "False"}:
        sl = sl[1:]
    if sl[-1] in {"True", "False"}:
        sl = sl[:-1]
    return json.loads("\n".join(sl))


def LintContents(content: str, tempdir: str | None = None) -> dict:
    """Lint the Snakefile using the snakemake library, returns JSON"""
    with IsolatedTempFile(content) as snakefile:
        lint_return = Lint(snakefile)
    return lint_return


def LoadWorkflow(filename: str) -> dict:
    """Load workflow from provided folder

    Valid Snakefile locations:
        ./Snakefile
        ./workflow/Snakefile
    """
    filename, workdir = GetFileAndWorkingDirectory(filename)
    return SplitByDagFromFile(filename, workdir)


def FullTokenizeFromFile(filename: str) -> dict:
    """Copy Snakefile contents to a new temporary file and analyze in isolation"""
    with open(filename, "r") as infile:
        with IsolatedTempFile(infile.read()) as tempfile:
            return SplitByRulesFromFile(tempfile)


def SplitByRulesFromFile(filename: str, workdir: str = "") -> dict:
    """
    Tokenize snakefile, split by 'rule' segments

    This function is conceptually similar to SplitByRulesFile, but takes the
    full filename of the Snakefile, which requires the file to be accessible by
    the local filesystem, allowing the parser to interrogate the originating
    folder for data files. This permits construction of directed acyclic graphs
    (DAGs)
    """
    fullfilename = os.path.abspath(filename)
    return SplitByIndent(fullfilename, workdir, get_dag=True)


def SplitByDagFromFile(filename: str, workdir: str = "") -> dict:
    """Tokenize input using rules derived from dag graph"""

    # Query snakemake for DAG of graph (used for connections)
    dag = DagLocal(os.path.abspath(filename), workdir)

    # Get rules text from origin Snakefile
    blocks = SplitByIndent(filename, workdir, get_dag=False)

    # Build JSON representation
    rules: Dict = {"block": []}
    for node in dag["nodes"]:
        # construct dictionary for block and add to list
        block = {
            "id": node["id"],
            "name": node["value"]["rule"],
            "type": "rule",
            "content": "(module)",
        }
        # cross-reference with block parser
        for b in blocks["block"]:
            if b["name"] == block["name"]:
                block["content"] = b["content"]
        rules["block"].append(block)
    # include config nodes
    for b in blocks["block"]:
        if b["type"] == "config" or b["type"] == "module":
            rules["block"].append(
                {
                    "id": len(rules["block"]),
                    "name": b["name"],
                    "type": b["type"],
                    "content": b["content"],
                }
            )

    # Return links, as determined by snakemake DAG
    links = []
    for link in dag["links"]:
        try:
            links.append(
                [
                    GetRuleFromID(rules["block"], link["u"]),
                    GetRuleFromID(rules["block"], link["v"]),
                ]
            )
        except KeyError:
            pass

    rules["links"] = {
        "id": -1,
        "name": "links",
        "type": "links",
        "content": links,
    }
    return rules


def GetRuleFromID(blocks: List[dict], id: int) -> str:
    for block in blocks:
        if block["id"] == id:
            return block["name"]
    return ""


def SplitByRulesFileContent(content: str) -> dict:
    """Tokenize Snakefile, split into 'rules', return as dict list of rules"""
    with IsolatedTempFile(content) as snakefile:
        rules = SplitByRulesFromFile(snakefile)
    return rules


def SplitByIndent(filename: str, workdir: str = "", get_dag: bool = False):
    """Tokenize input, splitting chunks by indentation level"""

    # Tokenize into blocks by indentation level
    with open(filename, "r") as file:
        contents = file.read()
    tf = TokenizeFile(contents)
    blockcount = max(tf.rootblock)

    # Query snakemake for DAG of graph (used for connections)
    if get_dag:
        dag = DagLocal(os.path.abspath(file.name), workdir)
    else:
        dag = {"nodes": [], "links": []}

    # Build JSON representation
    rules: Dict = {"block": []}
    for block_index in range(blockcount + 1):
        content = tf.GetBlockFromIndex(block_index)
        words = content.split()
        if not words:
            continue
        match words[0]:
            case "rule":
                blocktype = "rule"
                name = words[1].replace(":", "")
            case "module":
                blocktype = "module"
                name = words[1].replace(":", "")
            case _:
                blocktype = "config"
                name = "config"
        # construct dictionary for block and add to list
        block = {
            "id": block_index,
            "name": name,
            "type": blocktype,
            "content": content,
        }
        rules["block"].append(block)

    # Return links, as determined by snakemake DAG
    links = []
    dagnodes = [
        {"id": d["value"]["jobid"], "name": d["value"]["rule"]} for d in dag["nodes"]
    ]
    for link in dag["links"]:
        try:
            links.append(
                [GetRuleFromID(dagnodes, link["u"]), GetRuleFromID(dagnodes, link["v"])]
            )
        except KeyError:
            pass

    rules["links"] = {
        "id": -1,
        "name": "links",
        "type": "links",
        "content": links,
    }

    return rules


# ##############################################################################
# Utility functions
# ##############################################################################


def DagFileContent(content: str) -> dict:
    with IsolatedTempFile(content) as snakefile:
        dag = DagLocal(snakefile)
    return dag


def DagLocal(filename: str, workdir: str = "") -> dict:
    """Lint using snakemake library (returns on stdout with extra elements)"""
    kwargs = {"workdir": workdir} if workdir else {}
    stdout, stderr = snakemake(filename, "--d3dag", **kwargs)
    print(stdout)
    print(stderr)
    # strip first and last lines as needed (snakemake returns True/False)
    sl = stdout.split("\n")
    if sl[0] in {"True", "False"}:
        sl = sl[1:]
    if sl[-1] in {"True", "False"}:
        sl = sl[:-1]
    return json.loads("\n".join(sl))


def GetFileAndWorkingDirectory(filename):
    if os.path.isdir(filename):
        workdir = os.path.abspath(filename)
        filelist = [
            f"{workdir}/Snakefile",
            f"{workdir}/workflow/Snakefile",
        ]
        for file in filelist:
            if os.path.exists(file):
                filename = file
                break
    else:
        workdir = ""
    return filename, workdir


@contextlib.contextmanager
def IsolatedTempFile(content: str, tempdir=None):
    """Create isolated file with passed content placed into a new blank folder"""
    snakefile_dir = tempfile.TemporaryDirectory(dir=tempdir)
    snakefile_file = tempfile.NamedTemporaryFile(
        dir=snakefile_dir.name, mode="w", encoding="utf-8", delete=False
    )
    snakefile: str = snakefile_file.name
    snakefile_file.write(content)
    snakefile_file.seek(0)
    snakefile_file.close
    # Yield filename as context
    yield snakefile
    # Cleanup
    os.remove(snakefile)
    shutil.rmtree(snakefile_dir.name)


def snakemake(filename: str, *args, **kwargs) -> Tuple[str, str]:
    """Run snakemake as subprocess

    This function takes optional arguments that are passed through to the
    snakemake executable, with the exception of:
        workdir     Sets the working directory for job execution
    """
    # Get Snakefile path
    snakefile = os.path.abspath(filename)
    # Check for work directory, otherwise default to Snakefile directory
    workdir = kwargs.get("workdir", "")
    if not workdir:
        workdir = os.path.dirname(snakefile)
    # Collate arguments list
    try:
        del kwargs["workdir"]
    except KeyError:
        pass
    print(args)
    arglist = list(args)
    for k, v in kwargs.items():
        arglist.extend([k, v])
    # Default set a single core if none specified
    if "--cores" not in kwargs.keys() and "--cores" not in args:
        arglist.extend(["--cores", "1"])
    # Launch process and wait for return
    print(
        [
            "snakemake",
            "--snakefile",
            snakefile,
            *arglist,
            workdir,
        ]
    )
    p = subprocess.run(
        [
            "snakemake",
            "--snakefile",
            snakefile,
            *arglist,
        ],
        cwd=workdir,
        capture_output=True,
    )
    return p.stdout.decode("utf-8"), p.stderr.decode("utf-8")
