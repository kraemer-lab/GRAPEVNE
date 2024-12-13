import contextlib
import io
import json
import logging
import os
import platform
import re
import shutil
import subprocess
import tempfile
import threading
from contextlib import redirect_stderr
from contextlib import redirect_stdout
from pathlib import Path
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from typing import Union
from warnings import warn

import snakemake.deployment.conda
from snakemake.cli import main as snakemake_main

from builder.builder import BuildFromJSON
from builder.builder import YAMLToConfig
from runner.TokenizeFile import TokenizeFile
from grapevne.defs import get_port_spec, get_port_namespace

# ##############################################################################
# Skip Snakemake's conda version check (code adapted from Snakemake 8.25.3)
# See https://github.com/kraemer-lab/GRAPEVNE/issues/368
# ##############################################################################


def _check_version(self):
    from snakemake.shell import shell
    from packaging.version import Version

    version = shell.check_output(
        self._get_cmd("conda --version"), stderr=subprocess.PIPE, text=True
    )
    version_matches = re.findall(r"\d+\.\d+\.\d+", version)
    if len(version_matches) != 1:
        raise snakemake.exceptions.WorkflowError(
            f"Unable to determine conda version. 'conda --version' returned {version}"
        )
    else:
        version = version_matches[0]
    if Version(version) < Version(snakemake.deployment.conda.MIN_CONDA_VER):
        warn(
            f"Conda must be version {snakemake.deployment.conda.MIN_CONDA_VER} or "
            "later, found version {version}. "
            "Please update conda to the latest version. "
            "Note that you can also install conda into the snakemake environment "
            "without modifying your main conda installation.",
            stacklevel=2,
        )


_orig_check_version = snakemake.deployment.conda.Conda._check_version
snakemake.deployment.conda.Conda._check_version = _check_version

# ##############################################################################
# Log file
# ##############################################################################

logfile = os.path.expanduser("~") + "/GRAPEVNE.log"

# Set up logging
logging.basicConfig(
    filename=logfile,
    encoding="utf-8",
    level=logging.DEBUG,
)
logging.info("Working directory: %s", os.getcwd())


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
    stdout, stderr = snakemake_launch(
        filename,
        "--delete-all-output",
        workdir=workdir,
    )
    return {
        "status": "ok" if not stderr else "error",
        "content": {"stdout": stdout, "stderr": stderr},
    }


def Launch_cmd(filename: str, *args, **kwargs) -> Tuple[List[str], str]:
    """Return the snakemake launch command and working directory"""
    filename, workdir = GetFileAndWorkingDirectory(filename)
    return snakemake_cmd(
        filename,
        workdir=workdir,
        *args,
        **kwargs,
    )


def Launch(filename: str, *args, **kwargs) -> dict:
    """Launch snakemake workflow given a [locally accessible] location"""
    cmd, workdir = Launch_cmd(filename, *args, **kwargs)
    stdout, stderr = snakemake_run(cmd, workdir)
    return {
        "status": "ok" if not stderr else "error",
        "content": {"stdout": stdout, "stderr": stderr},
    }


def Lint(snakefile: str) -> dict:
    """Lint a Snakefile using the snakemake library, returns JSON"""
    try:
        stdout, _ = snakemake_launch(snakefile, "--lint", "json")
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


def GetRuleFromID(blocks: List[dict], blockid: int) -> str:
    """Get rule name from block ID"""
    for block in blocks:
        if block["id"] == blockid:
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


def CheckNodeDependencies(jsDeps: dict, snakemake_launcher: str | None = None) -> dict:
    """Check if all dependencies are resolved for a given node"""

    # Build model from JSON (for dependency analysis)
    build, model, _ = BuildFromJSON(jsDeps, singlefile=True, partial_build=True)

    # Determine input namespaces for target node
    config = model.ConstructSnakefileConfig()
    node = model.GetNodeByName(model.nodes[0].name)
    ruleconfig = config[node.rulename]["config"]
    ports = ruleconfig.get("ports", [])
    if not ports:
        ports = get_port_spec(ruleconfig.get("input_namespace", []))
    port_namespaces = set([get_port_namespace(p) for p in ports])  # set of namespaces

    # Determine unresolved dependencies (and their source namespaces)
    target_namespaces = set([f"results/{n}" for n in port_namespaces])
    missing_deps = set(
        GetMissingFileDependencies_FromContents(
            build,
            list(target_namespaces),
            snakemake_launcher=snakemake_launcher if snakemake_launcher else "",
        )
    )
    unresolved_dep_sources = set(
        s.split("/")[1] for s in missing_deps if s.startswith("results/")
    )

    # Target dependencies are resolved if there is no overlap between missing
    # dependencies and the target node's input namespaces
    unresolved_deps = unresolved_dep_sources.intersection(port_namespaces)
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
    stdout, _ = snakemake_launch(filename, "--d3dag", **kwargs)
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
    content: Union[Tuple[dict, str], str],
    target_namespaces: Union[None, List[str]] = None,
    snakemake_launcher: str = "",
) -> List[str]:
    """Get missing file dependencies from snakemake

    Recursively find missing dependencies for rulesets. Once missing
    dependencies are found, touch those file (in an isolated environment) and
    repeat the process to capture all missing dependencies.

    If target_namespaces is provided, return as soon as any target dependencies
    are found.
    """
    if not target_namespaces:
        target_namespaces = []
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
        while file_list := GetMissingFileDependencies_FromFile(
            snakefile,
            snakemake_launcher=snakemake_launcher,
        ):
            deps.extend(file_list)
            # Return early if target dependencies are not resolved
            if set(deps).intersection(target_namespaces):
                return deps

            # Touch missing files
            for dep in deps:
                target = os.path.abspath(os.path.join(path, dep))
                Path(os.path.dirname(target)).mkdir(parents=True, exist_ok=True)
                Path(target).touch()
    return deps


def GetMissingFileDependencies_FromFile(
    filename: str,
    *args,
    snakemake_launcher: str = "",
    **kwargs,
) -> List[str]:
    """Get missing file dependencies from snakemake (single file)

    Find missing dependencies for one run of a ruleset; for recursive /
    multiple runs use the corresponding _FromContents function.
    """
    if "--d3dag" not in args:
        args = args + ("--d3dag",)

    stdout, stderr = snakemake_launch(
        filename,
        *args,
        snakemake_launcher=snakemake_launcher,
        **kwargs,
    )
    stderr = "\n".join(stderr.split("\n"))
    if stdout:
        # build succeeded
        return []
    if not stderr:
        return []
    exceptions = set(
        [
            ex
            for ex in [line.split(" ")[0] for line in stderr.split("\n")[0:2]]
            if ex.endswith("Exception")
        ]
    )
    permitted_exceptions = set(
        [
            "MissingInputException",
        ]
    )
    if len(exceptions - permitted_exceptions) > 0:
        raise Exception(
            f"A non-expected error has been detected: \nstdout={stdout}\nstderr={stderr}"
        )
    fileslist = list(filter(None, map(str.strip, stderr.split("\n"))))
    try:
        ix = fileslist.index("affected files:")
    except ValueError:
        raise Exception("No affected files found: " + stdout + "\n" + stderr)
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
    snakefile_file.close()
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


def snakemake_cmd(filename: str, *args, **kwargs) -> Tuple[List[str], str]:
    """Determine snakemake command to launch as subprocess

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
    for k, v in kwargs.items():
        arglist.extend([k, v])
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
    return cmd, workdir


def snakemake_run(
    cmd: List[str],
    workdir: str,
    capture_output: bool = True,
    snakemake_launcher: str = "",
) -> Tuple[str, str]:
    """Run the snakemake command by the selected launch method"""
    logging.info("Launching snakemake [%s]: %s", snakemake_launcher, " ".join(cmd))
    snakemake_launcher = "builtin" if not snakemake_launcher else snakemake_launcher
    logging.info("Using launcher: %s", snakemake_launcher)
    if snakemake_launcher == "system":
        cmd_str = " ".join(cmd)
        shell = os.getenv("SHELL", "/bin/bash")
        cmd_str = shell + ' -i -c "' + cmd_str + '"'
        logging.info(
            f"Launching with cmd_str={cmd_str}, cwd={workdir}, capture_output={capture_output}, shell=True"
        )

        def stream_output(pipe, output_lines):
            for line in pipe:
                print(line, end="")
                output_lines.append(line)

        p = subprocess.Popen(
            cmd_str,
            cwd=workdir,
            # capture_output=capture_output,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        stdout_lines = []
        stderr_lines = []

        stdout_thread = threading.Thread(
            target=stream_output, args=(p.stdout, stdout_lines)
        )
        stderr_thread = threading.Thread(
            target=stream_output, args=(p.stderr, stderr_lines)
        )

        stdout_thread.start()
        stderr_thread.start()

        p.wait()
        stdout_thread.join()
        stderr_thread.join()

        return "".join(stdout_lines), "".join(stderr_lines)
    elif snakemake_launcher == "builtin":
        cmd_str = " ".join(cmd[1:])  # strip snakemake executable
        if capture_output:
            with redirect_stdout(io.StringIO()) as f_stdout:
                with redirect_stderr(io.StringIO()) as f_stderr:
                    try:
                        snakemake_main(
                            cmd_str + " -d " + workdir,
                        )
                    except SystemExit:
                        # SystemExit is raised by snakemake upon exit
                        pass
            return f_stdout.getvalue(), f_stderr.getvalue()
        else:
            try:
                snakemake_main(
                    cmd_str + " -d " + workdir,
                )
            except SystemExit:
                # SystemExit is raised by snakemake upon exit
                pass
            return "", ""
    else:
        raise Exception(f"Unsupported launcher: {snakemake_launcher}.")


def snakemake_launch(
    filename: str,
    *args,
    snakemake_launcher: str = "",
    **kwargs,
) -> Tuple[str, str]:
    """Construct the snakemake command and then launch

    See snakemake_cmd for details on arguments.
    """
    cmd, workdir = snakemake_cmd(filename, *args, **kwargs)
    return snakemake_run(cmd, workdir, snakemake_launcher=snakemake_launcher)
