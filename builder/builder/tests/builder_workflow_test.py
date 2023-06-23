import pytest

from builder import builder

workflow_folder = "builder/tests/workflow_import_test"


@pytest.mark.parametrize(
    "name",
    [
        "connect_source_sleep1input",
        "connect_sleep1input_sleep1input",
    ],
)
def test_Connect_Source_to_Sleep1Input(name: str):
    stub = f"{workflow_folder}/workflow_imports/{name}"
    c, m = builder.BuildFromFile(
        f"{stub}.json",
        singlefile=True,
        expand=True,
    )
    # Drop trailing newline (code formatter removes it from comparison file)
    c = c[:-1]
    with open(f"{stub}_expected.txt") as file:
        expected = file.read()
    assert c == expected


def test_Connect_Sleep1Input_to_Sleep1Input():
    pass
