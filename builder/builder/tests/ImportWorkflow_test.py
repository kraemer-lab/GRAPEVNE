from builder.ImportWorkflow import ImportWorkflowDir
from builder.ImportWorkflow import ParseFunctionSignature


def test_ImportWorkflow_ImportWorkflowDir() -> None:
    m = ImportWorkflowDir(
        "builder/tests/workflow_import_test/modules/skeleton",
    )
    assert len(m.nodes) == 3

    assert m.nodes[0].name == "module1"
    assert (
        m.nodes[0].snakefile
        == "builder/tests/workflow_import_test/modules/source/workflow/Snakefile"
    )
    assert m.nodes[0].output_namespace == "module1"

    assert m.nodes[1].name == "module2"
    assert (
        m.nodes[1].snakefile
        == "builder/tests/workflow_import_test/modules/sleep1input/workflow/Snakefile"
    )

    assert m.nodes[1].input_namespace == "module1"
    assert m.nodes[1].output_namespace == "module2"

    assert m.nodes[2].name == "module3"
    assert (
        m.nodes[2].snakefile
        == "builder/tests/workflow_import_test/modules/sleep2inputs/workflow/Snakefile"
    )
    assert m.nodes[2].input_namespace == {"in1": "module1", "in2": "module2"}
