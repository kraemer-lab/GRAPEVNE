import contextlib
import json
import os
import platform
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from typing import Union

from builder.builder import BuildFromJSON
from builder.builder import YAMLToConfig
from runner.TokenizeFile import TokenizeFile


# ##############################################################################
# Queries
# ##############################################################################


def Build(data: dict) -> str:
    """Build Snakefile from a dictionary of 'block' elements"""
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


def Launch(filename: str, **kwargs) -> dict:
    """Launch snakemake workflow given a [locally accessible] location"""
    filename, workdir = GetFileAndWorkingDirectory(filename)
    stdout, stderr = snakemake(
        filename,
        "--nolock",
        workdir=workdir,
        **kwargs,
    )
    return {
        "status": "ok" if not stderr else "error",
        "content": {"stdout": stdout, "stderr": stderr},
    }


def Lint(snakefile: str) -> dict:
    """Lint a Snakefile using the snakemake library, returns JSON"""
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


def LintContents(content: str, tempdir: Optional[str] = None) -> dict:
    """Lint Snakefile contents using the snakemake library, returns JSON"""
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
    the local filesystem, allowing the runner to interrogate the originating
    folder for data files. This permits construction of directed acyclic graphs
    (DAGs)
    """
    fullfilename = os.path.abspath(filename)
    return SplitByIndent(fullfilename, workdir, get_dag=True)


def SplitByDagFromFile(filename: str, workdir: str = "") -> dict:
    """Tokenize input using rules derived from dag graph"""
    print("here")

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
        # cross-reference with block runner
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
    """Get rule name from block ID"""
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
        if words[0] == "rule":
            blocktype = "rule"
            name = words[1].replace(":", "")
        elif words[0] == "module":
            blocktype = "module"
            name = words[1].replace(":", "")
        else:
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


def CheckNodeDependencies(jsDeps: dict) -> dict:
    """Check if all dependencies are resolved for a given node"""

    # Build model from JSON (for dependency analysis)
    build, model = BuildFromJSON(jsDeps, singlefile=True)

    # Determine input namespaces for target node
    input_namespaces = model.ConstructSnakefileConfig()[
        model.GetNodeByName(model.nodes[0].name).rulename  # first (target) node
    ].get("input_namespace", {})
    if isinstance(input_namespaces, str):
        input_namespaces = {"In": input_namespaces}
    if not input_namespaces:
        input_namespaces = {"In": "In"}
    input_namespaces = set(input_namespaces.values())

    # Determine unresolved dependencies (and their source namespaces)
    target_namespaces = set([f"results/{n}" for n in input_namespaces])
    missing_deps = set(
        GetMissingFileDependencies_FromContents(build, list(target_namespaces))
    )
    unresolved_dep_sources = set(
        s.split("/")[1] for s in missing_deps if s.startswith("results/")
    )

    # Target dependencies are resolved if there is no overlap between missing
    # dependencies and the target node's input namespaces
    unresolved_deps = unresolved_dep_sources.intersection(input_namespaces)
    if unresolved_deps:
        return {
            "status": "missing",
            "unresolved": list(unresolved_deps),
        }
    return {"status": "ok"}


# ##############################################################################
# Utility functions
# ##############################################################################


def DagFileContent(content: str) -> dict:
    """Returns DAG as JSON from Snakefile content"""
    with IsolatedTempFile(content) as snakefile:
        dag = DagLocal(snakefile)
    return dag


def DagLocal(filename: str, workdir: str = "") -> dict:
    """Returns DAG as JSON from Snakefile"""
    kwargs = {"workdir": workdir} if workdir else {}
    stdout, stderr = snakemake(filename, "--d3dag", **kwargs)
    # strip first and last lines as needed (snakemake returns True/False)
    sl = stdout.split("\n")
    if sl[0] in {"True", "False"}:
        sl = sl[1:]
    if sl[-1] in {"True", "False"}:
        sl = sl[:-1]
    return json.loads("\n".join(sl))


def GetFileAndWorkingDirectory(filename: str) -> Tuple[str, str]:
    """Get file and working directory from filename"""
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


def GetMissingFileDependencies_FromContents(
    content: Union[Tuple[dict, str], str], target_namespaces: List[str] = []
) -> List[str]:
    """Get missing file dependencies from snakemake

    Recursively find missing dependencies for rulesets. Once missing
    dependencies are found, touch those file (in an isolated environment) and
    repeat the process to capture all missing dependencies.

    If target_namespaces is provided, return as soon as any target dependencies
    are found.
    """
    if isinstance(content, tuple):
        # Flattern config and Snakemake files together
        workflow_lines = content[1].split("\n")
        workflow_lines = [
            line for line in workflow_lines if not line.startswith("configfile:")
        ]
        content = (content[0], "\n".join(workflow_lines))
        content_str: str = YAMLToConfig(content[0]) + "\n" + content[1]
    else:
        content_str = content
    deps = []
    with IsolatedTempFile(content_str) as snakefile:
        path = os.path.dirname(os.path.abspath(snakefile))
        while file_list := GetMissingFileDependencies_FromFile(snakefile):
            deps.extend(file_list)

            # Return early if target dependencies are not resolved
            if set(deps).intersection(target_namespaces):
                return deps

            # Touch missing files
            for dep in deps:
                target = os.path.abspath(f"{path}/{dep}")
                Path(os.path.dirname(target)).mkdir(parents=True, exist_ok=True)
                Path(target).touch()
    return deps


def GetMissingFileDependencies_FromFile(filename: str, *args, **kwargs) -> List[str]:
    """Get missing file dependencies from snakemake (single file)

    Find missing dependencies for one run of a ruleset; for recursive /
    multiple runs use the corresponding _FromContents function.
    """
    if "--d3dag" not in args:
        args = args + ("--d3dag",)
    stdout, stderr = snakemake(filename, *args, **kwargs)
    stderr = "\n".join(stderr.split("\n"))
    if stdout:
        # build succeeded
        return []
    if not stderr:
        return []
    if "MissingInputException" not in [
        line.split(" ")[0] for line in stderr.split("\n")[0:2]
    ]:
        raise Exception(
            f"A non-MissingInputException error has been detected: \nstdout={stdout}\nstderr={stderr}"
        )
    fileslist = list(filter(None, map(str.strip, stderr.split("\n"))))
    ix = fileslist.index("affected files:")
    return fileslist[(ix + 1) :]


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


def WrapCommandForTerminal(cmd: List[str], workdir: str) -> List[str]:
    """Wrap command for terminal execution

    This function takes a command and wraps it in a terminal execution command
    for the current platform.
    """
    cmdstr = " ".join(cmd)
    if platform.system() == "Windows":
        # Launch terminal process on Windows
        cmd = [
            "cmd.exe",
            "/k",  # Keep terminal open after execution
            f'"cd {workdir}\n{cmdstr}"',
        ]
    elif platform.system() == "Darwin":
        # Launch terminal process on macOS
        cmd = [
            "osascript",
            "-e",
            f'tell app "Terminal" to do script "cd {workdir}\n{cmdstr}"',
        ]
    elif platform.system() == "Linux":
        # Launch terminal process on Linux
        cmd = ["x-terminal-emulator", "-e", f'"cd {workdir}\n{cmdstr}"']
    else:
        raise Exception(f"Unsupported platform: {platform.system()}.")
    return cmd


def snakemake(filename: str, *args, **kwargs) -> Tuple[str, str]:
    """Run snakemake as subprocess

    This function takes optional arguments that are passed through to the
    snakemake executable, with the exception of:
        workdir: sets the working directory for job execution
        terminal: if True, run snakemake in a terminal window
    """
    # Get Snakefile path
    snakefile = os.path.abspath(filename)
    # Check for work directory, otherwise default to Snakefile directory
    workdir = kwargs.get("workdir", "")
    if not workdir:
        workdir = os.path.dirname(snakefile)
    try:
        del kwargs["workdir"]
    except KeyError:
        pass
    # Check for terminal flag, then omit from kwargs
    terminal = kwargs.get("terminal", None)
    try:
        del kwargs["terminal"]
    except KeyError:
        pass
    # Collate arguments list
    arglist = list(args)
    # Ensure conda is enabled
    if "--use-conda" not in arglist:
        arglist.append("--use-conda")
    for k, v in kwargs.items():
        arglist.extend([k, v])
    # Default set a single core if none specified
    if "--cores" not in kwargs.keys() and "--cores" not in args:
        arglist.extend(["--cores", "1"])
    # Launch process and wait for return
    cmd = [
        "snakemake",
        "--snakefile",
        snakefile,
        *arglist,
    ]
    if terminal:
        cmd = WrapCommandForTerminal(cmd, workdir)
    print(cmd)
    print("$" + (" ".join(cmd)) + "$")
    p = subprocess.run(
        cmd,
        cwd=workdir,
        capture_output=True,
    )
    return p.stdout.decode("utf-8"), p.stderr.decode("utf-8")
