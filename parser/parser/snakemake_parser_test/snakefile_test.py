import json
from unittest import mock

from parser.snakemake_parser.snakefile import Build
from parser.snakemake_parser.snakefile import LintContents
from parser.snakemake_parser.snakefile import SplitByRulesFileContent


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
