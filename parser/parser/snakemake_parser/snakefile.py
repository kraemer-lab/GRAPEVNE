import contextlib
import itertools
import json
import os
import shutil
import subprocess
import tempfile
import tokenize
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
    stdout, stderr = snakemake(filename, "--delete-all-output")
    return {
        "status": "ok" if not stderr else "error",
        "content": {"stdout": stdout, "stderr": stderr},
    }


def Launch(filename: str) -> dict:
    """Launch snakemake workflow based upon provided [locally accessible] Snakefile"""
    stdout, stderr = snakemake(filename, "--nolock")
    return {
        "status": "ok" if not stderr else "error",
        "content": {"stdout": stdout, "stderr": stderr},
    }


def Lint(filename: str) -> dict:
    """Lint the Snakefile using the snakemake library, returns JSON"""
    return Snakemake_Lint(filename)


def LintContents(content: str, tempdir: str | None = None) -> dict:
    """Lint the Snakefile using the snakemake library, returns JSON"""
    with IsolatedTempFile(content) as snakefile:
        lint_return = Snakemake_Lint(snakefile)
    return lint_return


def FullTokenizeFromFile(filename: str) -> dict:
    """Copy Snakefile contents to a new temporary file and analyze in isolation"""
    with open(filename, "r") as infile:
        with IsolatedTempFile(infile.read()) as tempfile:
            return SplitByRulesFromFile(tempfile)


def SplitByRulesFromFile(filename: str) -> dict:
    """
    Tokenize snakefile, split by 'rule' segments

    This function is conceptually similar to SplitByRulesFile, but takes the
    full filename of the Snakefile, which requires the file to be accessible by
    the local filesystem, allowing the parser to interrogate the originating
    folder for data files. This permits construction of directed acyclic graphs
    (DAGs)
    """
    fullfilename = os.path.abspath(filename)
    file = open(fullfilename, "rb")
    return SplitByRules(file, get_dag=True)


def SplitByRulesFileContent(content: str) -> dict:
    """Tokenize Snakefile, split into 'rules', return as dict list of rules"""
    with IsolatedTempFile(content) as snakefile:
        rules = SplitByRulesFromFile(snakefile)
    return rules


def SplitByRules(file, get_dag: bool = False):
    # Tokenize input, splitting chunks by 'rule' statement
    result: List = [[]]
    chunk = 0
    tokens = tokenize.tokenize(file.readline)
    for toknum, tokval, _, _, _ in tokens:
        if toknum == tokenize.NAME and tokval == "rule":
            chunk += 1
            result.append([])
        result[chunk].append((toknum, tokval))

    # Query snakemake for DAG of graph (used for connections)
    if get_dag:
        dag = DagLocal(os.path.abspath(file.name))
    else:
        dag = {"nodes": [], "links": []}
    dag_to_block = {}

    # Build JSON representation (consisting of a list of rules text)
    rules: Dict = {"block": []}
    for block_index, r in enumerate(result):
        # stringify code block
        content = tokenize.untokenize(r)
        if isinstance(content, bytes):  # if byte string, decode
            content = content.decode("utf-8")
        # derive rule name
        if r[0][1] == "rule":
            blocktype = "rule"
            strlist = [tokval for _, tokval in r]
            index_to = strlist.index(":")
            name = "".join(strlist[1:index_to])
        else:
            blocktype = "config"
            name = "Configuration"
        # Find and parse input block
        ignore_tokens: List[Tuple] = []
        search_seq = [(1, "input"), (54, ":")]
        tf = TokenizeFile(content)
        input_sections = tf.GetBlock(search_seq, ignore_tokens)
        # Find and parse output block
        search_seq = [(1, "output"), (54, ":")]
        output_sections = tf.GetBlock(search_seq, ignore_tokens)
        # Cross-reference with DAG and mark associations with nodes and lines
        dag_index = [
            ix for ix, node in enumerate(dag["nodes"]) if node["value"]["label"] == name
        ]
        # dag from snakemake can contain the same rules multiple times for
        # multiple input files, associate all with the same rule block
        for ix in dag_index:
            dag_to_block[ix] = block_index
        # construct dictionary for block and add to list
        block = {
            "id": block_index,
            "name": name,
            "type": blocktype,
            "content": content,
            "input": input_sections,
            "output": output_sections,
        }
        rules["block"].append(block)

    # Return links, as determined by snakemake DAG
    links = []
    for link in dag["links"]:
        links.append([dag_to_block[link["u"]], dag_to_block[link["v"]]])
    # Remove duplicates (from multiple input files in DAG)
    links.sort()
    links = list(k for k, _ in itertools.groupby(links))

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


def DagLocal(filename: str) -> dict:
    """Lint using snakemake library (returns on stdout with extra elements)"""
    stdout, stderr = snakemake(filename, "--d3dag")
    # strip first and last lines as needed (snakemake returns True/False)
    print(stdout)
    print(stderr)
    sl = stdout.split("\n")
    if sl[0] in {"True", "False"}:
        sl = sl[1:]
    if sl[-1] in {"True", "False"}:
        sl = sl[:-1]
    return json.loads("\n".join(sl))


def Snakemake_Lint(snakefile: str) -> dict:
    # Lint using snakemake library (returns on stdout with extra elements)
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
    """Run snakemake as subprocess"""
    # Collate arguments list
    arglist = list(args)
    for k, v in kwargs.items():
        arglist.extend([k, v])
    # Default set a single core if none specified
    if "--cores" not in kwargs.keys() and "--cores" not in args:
        arglist.extend(["--cores", "1"])
    # Launch process and wait for it to return
    snakefile = os.path.abspath(filename)
    p = subprocess.run(
        [
            "snakemake",
            "--snakefile",
            os.path.basename(snakefile),
            *arglist,
        ],
        cwd=os.path.dirname(snakefile),
        capture_output=True,
    )
    return p.stdout.decode("utf-8"), p.stderr.decode("utf-8")
