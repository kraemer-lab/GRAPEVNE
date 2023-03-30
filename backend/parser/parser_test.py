import json
from parser.parser import Snakefile_Build
from parser.parser import Snakefile_Lint
from parser.parser import Snakefile_SplitByRules


def test_Snakefile_Build():
    rules = {
        "block": [
            {"name": "name1", "type": "type1", "content": "code1a\ncode1b"},
            {"name": "name2", "type": "type2", "content": "code2"},
            {"name": "name3", "type": "type3", "content": "\ncode3\n"},
        ]
    }
    expected = "code1a\ncode1b\ncode2\n\ncode3\n\n"
    contents = Snakefile_Build(rules)
    assert contents == expected


def test_Snakefile_Lint():
    # Load test case
    with open("parser/Snakefile", "r") as file:
        contents = file.read()
    lint_return = Snakefile_Lint(contents)
    with open("parser/Snakefile_lint", "r") as file:
        expected = json.load(file)
    # Linters will differ by their Snakefile filenames:
    for rule in lint_return["rules"]:
        rule["for"]["snakefile"] = "parser/Snakefile"
    assert lint_return == expected


def test_Snakefile_SplitByRules():
    # Load test case
    with open("parser/Snakefile", "r") as file:
        contents = file.read()
    # Tokenise and split by rule
    result = Snakefile_SplitByRules(contents)
    assert isinstance(result, dict)
    assert isinstance(result["block"], list)
    assert len(result["block"]) == 6  # six blocks
    for block in result["block"]:
        assert "name" in block
        assert "content" in block
