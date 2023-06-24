from typing import List
from typing import Tuple

import pytest
import yaml

from builder import builder

workflow_folder = "builder/tests/workflow_import_test"


@pytest.mark.parametrize(
    "name",
    [
        (["source", "sleep1input"], "srcsleep1in"),
        (["sleep1input", "sleep1input"], "c2sleep1in"),
        (["c2sleep1in", "c2sleep1in"], "c2c2sleep1in"),
    ],
)
def test_Workflow_Imports(name: Tuple[List[str], str]):
    modules, module_out = name
    build, m = builder.BuildFromFile(
        f"{workflow_folder}/workflow_imports/connect_{modules[0]}_{modules[1]}.json",
        singlefile=True,
        expand=True,
    )
    configfile: str = str(build[0])
    snakefile: str = str(build[1])
    # Remove last newline (test files stripped by syntax formatter)
    snakefile = snakefile[:-1]
    configfileYAML = yaml.safe_load(configfile)
    with open(f"{workflow_folder}/modules/{module_out}/config/config.yaml") as file:
        configfileYAML_expected = yaml.safe_load(file.read())
    for key in ["input_namespace", "output_namespace"]:
        assert configfileYAML[key] == configfileYAML_expected[key]
    with open(f"{workflow_folder}/modules/{module_out}/workflow/Snakefile") as file:
        assert str(snakefile) == file.read()
