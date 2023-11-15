from typing import List
from typing import Tuple

import pytest
import yaml

from builder import builder

workflow_folder = "builder/tests/workflow_import_test"


@pytest.mark.parametrize(
    "name",
    [
        ("connect_source_sleep1input", "srcsleep1in"),
        ("connect_sleep1input_sleep1input", "c2sleep1in"),
        ("connect_c2sleep1in_c2sleep1in", "c2c2sleep1in"),
        ("connect_source_c2sleep1in", "srcc2sleep1in"),
        ("connect_2source_sleep2inputs", "2srcsleep2in"),
        ("connect_1source_sleep2inputs", "1srcsleep2in"),
        ("connect_2source_2sleep2inputs", "2src2sleep2in"),
    ],
)
def test_Workflow_Imports(name: Tuple[List[str], str]):
    modules, module_out = name
    build, _, _ = builder.BuildFromFile(
        f"{workflow_folder}/workflow_imports/{modules}.json",
        singlefile=True,
        expand=True,
        add_configutil=False,
    )
    configfile: str = str(build[0])
    snakefile: str = str(build[1])
    # Remove last newline (test files stripped by syntax formatter)
    # snakefile = snakefile[:-1]
    configfileYAML = yaml.safe_load(configfile)
    with open(f"{workflow_folder}/modules/{module_out}/config/config.yaml") as file:
        configfileYAML_expected = yaml.safe_load(file.read())
    for key in ["input_namespace", "output_namespace"]:
        assert configfileYAML[key] == configfileYAML_expected[key]
    with open(f"{workflow_folder}/modules/{module_out}/workflow/Snakefile") as file:
        assert str(snakefile) == file.read()
