from typing import List
from typing import Tuple

import pytest
import yaml
from grapevne.defs import get_port_namespace
from grapevne.defs import get_port_spec

from builder import builder

workflow_folder = "builder/tests/workflow_import_test"


@pytest.mark.parametrize(
    "name",
    [
        ("connect_ports_source_sleep1input", "srcsleep1in_ports"),
        ("connect_ports_sleep1input_sleep1input", "c2sleep1in_ports"),
        ("connect_ports_c2sleep1in_c2sleep1in", "c2c2sleep1in_ports"),
        ("connect_ports_source_c2sleep1in", "srcc2sleep1in_ports"),
        ("connect_ports_2source_sleep2inputs", "2srcsleep2in_ports"),
        ("connect_ports_1source_sleep2inputs", "1srcsleep2in_ports"),
        ("connect_ports_2source_2sleep2inputs", "2src2sleep2in_ports"),
    ],
)
def test_Workflow_Imports(name: Tuple[List[str], str]):
    modules, module_out = name
    build, _, _ = builder.BuildFromFile(
        f"{workflow_folder}/workflow_imports/{modules}.json",
        singlefile=True,
        expand=True,
    )
    configfile = str(build[0])
    snakefile = str(build[1])
    configfileYAML = yaml.safe_load(configfile)
    with open(f"{workflow_folder}/modules/{module_out}/config/config.yaml") as file:
        configfileYAML_expected = yaml.safe_load(file.read())
    # Check each port for appropriate connections
    actual_ports = configfileYAML["ports"]
    expected_ports = configfileYAML_expected["ports"]
    assert len(actual_ports) == len(expected_ports)
    for port in actual_ports:
        found = False
        for p in expected_ports:
            #  Check namespaces and mapping, which are structural
            #  Ignore ref's and labels, which are internal / user-centric
            if p["namespace"] == port["namespace"] and p.get("mapping", []) == port.get(
                "mapping", []
            ):
                found = True
                break
        assert found
    assert configfileYAML["namespace"] == configfileYAML_expected["namespace"]
    with open(f"{workflow_folder}/modules/{module_out}/workflow/Snakefile") as file:
        assert str(snakefile) == file.read()


# Old-form 'namespace' tests
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
def test_Workflow_Imports_namespace(name: Tuple[List[str], str]):
    modules, module_out = name
    build, _, _ = builder.BuildFromFile(
        f"{workflow_folder}/workflow_imports/{modules}.json",
        singlefile=True,
        expand=True,
    )
    configfile = str(build[0])
    snakefile = str(build[1])
    configfileYAML = yaml.safe_load(configfile)
    with open(f"{workflow_folder}/modules/{module_out}/config/config.yaml") as file:
        configfileYAML_expected = yaml.safe_load(file.read())
    expected_ports = get_port_spec(configfileYAML_expected["input_namespace"])
    # Enforce port name for old-form 'module$'
    for port in expected_ports:
        if port["ref"].endswith("$"):
            port["ref"] = port["ref"] + "in"
    # Check each port for appropriate connections
    for port in configfileYAML["ports"]:
        actual = get_port_namespace(port)
        expected = get_port_namespace(
            [p for p in expected_ports if p["ref"] == port["ref"]]
        )
        assert actual == expected
    assert configfileYAML["namespace"] == configfileYAML_expected["output_namespace"]
    with open(f"{workflow_folder}/modules/{module_out}/workflow/Snakefile") as file:
        assert str(snakefile) == file.read()
