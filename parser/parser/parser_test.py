import os

from parser.snakemake_parser.snakefile import SplitByRulesLocal


def test_SplitByRulesLocal():
    filename = os.path.abspath("../examples/snakemake-short-tutorial/Snakefile")
    blocks = SplitByRulesLocal(filename)
    expected_links = [[2, 3], [3, 4], [4, 1], [4, 5], [5, 1]]
    assert blocks["links"]["content"] == expected_links
