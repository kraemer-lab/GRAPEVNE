import io
import itertools
import json
import os
import tempfile
import tokenize
from contextlib import redirect_stdout
from typing import Dict
from typing import List
from typing import Tuple

from snakemake import snakemake
from snakemake.exceptions import RuleException

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


def Lint(filename: str) -> dict:
    """Lint the Snakefile using the snakemake library, returns JSON"""
    return Snakemake_Lint(filename)


def LintContents(content: str, tempdir: str | None = None) -> dict:
    """Lint the Snakefile using the snakemake library, returns JSON"""
    snakefile = ToTempFile(content)
    lint_return = Snakemake_Lint(snakefile)
    DeleteTempFile(snakefile)
    return lint_return


def SplitByRulesLocal(filename: str) -> dict:
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
    snakefile = ToTempFile(content)
    rules = SplitByRulesLocal(snakefile)
    DeleteTempFile(snakefile)
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
    snakefile = ToTempFile(content)
    dag = DagLocal(snakefile)
    DeleteTempFile(snakefile)
    return dag


def DagLocal(filename: str) -> dict:
    """Lint using snakemake library (returns on stdout with extra elements)"""
    # Change to originating direcotry so that snakemake can parse folder structure
    snakefile = os.path.abspath(filename)
    original_folder = os.getcwd()
    os.chdir(os.path.dirname(snakefile))
    # Capture snakemake stdout
    f = io.StringIO()
    with redirect_stdout(f):
        snakemake(snakefile, printd3dag=True)
    os.chdir(original_folder)
    # strip first and last lines as needed (snakemake returns True/False)
    sl = f.getvalue().split("\n")
    if sl[0] in {"True", "False"}:
        sl = sl[1:]
    if sl[-1] in {"True", "False"}:
        sl = sl[:-1]
    return json.loads("\n".join(sl))


def Snakemake_Lint(snakefile: str) -> dict:
    # Lint using snakemake library (returns on stdout with extra elements)
    f = io.StringIO()
    with redirect_stdout(f):
        try:
            snakemake(snakefile, lint="json")
        except RuleException as e:
            return {"error": str(e)}
    # strip first and last lines as needed (snakemake returns)
    sl = f.getvalue().split("\n")
    if sl[0] in {"True", "False"}:
        sl = sl[1:]
    if sl[-1] in {"True", "False"}:
        sl = sl[:-1]
    return json.loads("\n".join(sl))


def ToTempFile(content: str, tempdir: str = "/tmp") -> str:
    snakefile_file = tempfile.NamedTemporaryFile(
        dir=tempdir, mode="w", encoding="utf-8", delete=False
    )
    snakefile: str = snakefile_file.name
    snakefile_file.write(content)
    snakefile_file.seek(0)
    snakefile_file.close
    return snakefile


def DeleteTempFile(snakefile: str) -> None:
    os.remove(snakefile)
