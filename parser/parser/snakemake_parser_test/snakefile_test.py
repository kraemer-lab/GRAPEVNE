import json
import os
from unittest import mock

from parser.snakemake_parser.snakefile import Build
from parser.snakemake_parser.snakefile import FullTokenizeFromFile
from parser.snakemake_parser.snakefile import IsolatedTempFile
from parser.snakemake_parser.snakefile import LintContents
from parser.snakemake_parser.snakefile import SplitByRulesFileContent
from parser.snakemake_parser.snakefile import SplitByRulesFromFile


def test_Snakefile_Build():
    rules = {
        "block": [
            {"name": "name1", "type": "type1", "content": "code1a\ncode1b"},
            {"name": "name2", "type": "type2", "content": "code2"},
            {"name": "name3", "type": "type3", "content": "\ncode3\n"},
        ]
    }
    expected = "code1a\ncode1b\ncode2\n\ncode3\n\n"
    contents = Build(rules)
    assert contents == expected


def test_Snakefile_Lint():
    # Load test case
    with open("parser/snakemake_parser_test/Snakefile", "r") as file:
        contents = file.read()
    lint_return = LintContents(contents)
    with open("parser/snakemake_parser_test/Snakefile_lint", "r") as file:
        expected = json.load(file)
    # Linters will differ by their Snakefile filenames:
    for rule in lint_return["rules"]:
        rule["for"]["snakefile"] = "parser/Snakefile"
    assert lint_return == expected


def test_Snakefile_SplitByRules():
    # Load test case
    with open("parser/snakemake_parser_test/Snakefile", "r") as file:
        contents = file.read()
    # Tokenise and split by rule
    with mock.patch(
        "parser.snakemake_parser.snakefile.DagLocal",
        return_value={"nodes": [], "links": []},
    ):
        result = SplitByRulesFileContent(contents)
    assert isinstance(result, dict)
    assert isinstance(result["block"], list)
    assert len(result["block"]) == 6
    for block in result["block"]:
        assert "name" in block
        assert "content" in block


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


def test_SplitByRulesFromFile_submodules():
    filename = os.path.abspath("../examples/submodules/Snakefile")
    blocks = SplitByRulesFromFile(filename)
    # Some datafiles are present, so those links are not included in the DAG
    expected_links = [[3, 1]]
    assert blocks["links"]["content"] == expected_links


def test_SplitByRulesFileContent():
    filename = os.path.abspath("../examples/snakemake-short-tutorial/Snakefile")
    with open(filename, "r") as file:
        blocks = SplitByRulesFileContent(file.read())
    expected_links = [[2, 3], [3, 4], [4, 1], [4, 5], [5, 1], [6, 2], [6, 4], [7, 2]]
    assert blocks["links"]["content"] == expected_links


def test_IsolatedTempFile():
    contents = "Sample contents"
    with IsolatedTempFile(contents) as temp_filename:
        filename = temp_filename
        assert os.path.exists(filename)
        with open(filename, "r") as infile:
            assert infile.read() == contents
    assert not os.path.exists(filename)
