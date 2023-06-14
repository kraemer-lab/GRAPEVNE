from builder.ImportWorkflow import ImportWorkflowDir
from builder.ImportWorkflow import ParseFunctionSignature


def test_ImportWorkflow_ImportWorkflowDir() -> None:
    m = ImportWorkflowDir(
        "builder/tests/workflow_import_test/",
        levels=-1,
    )
    print(m.nodes)
    print(m.nodes[0])
    print(m.nodes[0].name)
    print(m.nodes[0].snakefile)
    assert len(m.nodes) == 3

    assert m.nodes[0].name == "module1"
    assert m.nodes[0].snakefile == "snakefile1"
    assert m.nodes[0].output_namespace == "module1"

    assert m.nodes[1].name == "module2"
    assert isinstance(m.nodes[1].snakefile, dict)
    assert m.nodes[1].snakefile.get("function", None) == "calling_fcn"
    assert m.nodes[1].snakefile.get("args", []) == ["arg1", "arg2"]
    assert m.nodes[1].snakefile.get("kwargs", {}) == {
        "kwarg1": "kwval1",
        "kwarg2": "kwval2",
    }
    assert m.nodes[1].input_namespace == "module1"
    assert m.nodes[1].output_namespace == "module2"

    assert m.nodes[2].name == "module3"
    assert m.nodes[2].snakefile == "snakefile3"
    assert m.nodes[2].input_namespace == {"in1": "module1", "in2": "module2"}


def test_ParesFunctionSignature():
    c = 'fcn("pos1", 2, kw1="val3", kw2=4)'
    name, args, kwargs = ParseFunctionSignature(c)
    assert name == "fcn"
    assert args == ("pos1", 2)
    assert kwargs == {"kw1": "val3", "kw2": 4}
