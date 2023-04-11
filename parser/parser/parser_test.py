import os

from parser.snakemake_parser.snakefile import FullTokenizeFromFile
from parser.snakemake_parser.snakefile import IsolatedTempFile
from parser.snakemake_parser.snakefile import SplitByRulesFileContent
from parser.snakemake_parser.snakefile import SplitByRulesFromFile

# from parser.snakemake_parser.snakefile import Build
# from parser.snakemake_parser.snakefile import DagFileContent
# from parser.snakemake_parser.snakefile import DagLocal
# from parser.snakemake_parser.snakefile import DeleteAllOutput
# from parser.snakemake_parser.snakefile import Launch
# from parser.snakemake_parser.snakefile import Lint
# from parser.snakemake_parser.snakefile import LintContents
# from parser.snakemake_parser.snakefile import snakemake
# from parser.snakemake_parser.snakefile import Snakemake_Lint
# from parser.snakemake_parser.snakefile import SplitByRules


def test_Build():
    # TODO
    ...


def test_DeleteAllOutput():
    # TODO
    ...


def test_Launch():
    # TODO
    ...


def test_Lint():
    # TODO
    ...


def test_LintContents():
    # TODO
    ...


def test_FullTokenizeFromFile():
    filename = os.path.abspath("../examples/snakemake-short-tutorial/Snakefile")
    blocks = FullTokenizeFromFile(filename)
    expected_links = [[2, 3], [3, 4], [4, 1], [4, 5], [5, 1], [6, 2], [6, 4], [7, 2]]
    assert blocks["links"]["content"] == expected_links


def test_SplitByRulesFromFile():
    filename = os.path.abspath("../examples/snakemake-short-tutorial/Snakefile")
    blocks = SplitByRulesFromFile(filename)
    # Some datafiles are present, so those links are not included in the DAG
    expected_links = [[2, 3], [3, 4], [4, 1], [4, 5], [5, 1]]
    assert blocks["links"]["content"] == expected_links


def test_SplitByRulesFileContent():
    filename = os.path.abspath("../examples/snakemake-short-tutorial/Snakefile")
    with open(filename, "r") as file:
        blocks = SplitByRulesFileContent(file.read())
    expected_links = [[2, 3], [3, 4], [4, 1], [4, 5], [5, 1], [6, 2], [6, 4], [7, 2]]
    assert blocks["links"]["content"] == expected_links


def test_SplitByRules():
    # TODO
    ...


def test_DagFileContent():
    # TODO
    ...


def test_DagLocal():
    # TODO
    ...


def test_Snakemake_Lint():
    # TODO
    ...


def test_IsolatedTempFile():
    contents = "Sample contents"
    with IsolatedTempFile(contents) as temp_filename:
        filename = temp_filename
        assert os.path.exists(filename)
        with open(filename, "r") as infile:
            assert infile.read() == contents
    assert not os.path.exists(filename)


def test_snakemake():
    # TODO
    ...
