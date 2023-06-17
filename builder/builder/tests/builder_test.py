import pytest

from builder.builder import Model
from builder.builder import YAMLToConfig


def test_BuildSnakefile():
    m = Model()
    # Add modules
    m.AddModule("module1", {"snakefile": "snakefile1"})
    m.AddModule("module2", {"snakefile": "snakefile2"})
    m.AddModule("module3", {"snakefile": "snakefile3"})
    m.AddConnector("conn23", {"map": ["module2", "module3"]})
    # Verify Snakefile
    target_snakefile = """configfile: "config/config.yaml"

module module1:
    snakefile:
        config["module1"]["snakefile"]
    config:
        config["module1"]["config"]
use rule * from module1 as module1_*

module module2:
    snakefile:
        config["module2"]["snakefile"]
    config:
        config["module2"]["config"]
use rule * from module2 as module2_*

module module3:
    snakefile:
        config["module3"]["snakefile"]
    config:
        config["module3"]["config"]
use rule * from module3 as module3_*

"""
    assert m.BuildSnakefile() == target_snakefile


def test_ConstructSnakefileConfig():
    m = Model()
    m.AddModule("module1", {"snakefile": "snakefile1", "params": {"param1": "value1"}})
    m.AddModule(
        "module2", {"snakefile": "snakefile2", "input_namespace": "in3", "params": {}}
    )
    m.AddModule(
        "module3", {"snakefile": "snakefile2", "input_namespace": "in3", "params": {}}
    )
    # Namespace connector
    m.AddConnector("conn12", {"map": ["module1", "module2"]})
    m.AddConnector("conn23", {"map": ["module2", "module3"]})
    c = m.ConstructSnakefileConfig()
    # Verify config
    assert c["module1"]["config"].get("param1", None) == "value1"
    assert (
        c["module2"]["config"]["input_namespace"]
        == c["module1"]["config"]["output_namespace"]
    )
    assert (
        c["module3"]["config"]["input_namespace"]
        == c["module2"]["config"]["output_namespace"]
    )


@pytest.mark.skip(reason="Not implemented")
def test_BuildSnakefileConfig():
    # m = Model()
    # m.BuildSnakefileConfig()
    ...


@pytest.mark.skip(reason="Not implemented")
def test_SaveWorkflow():
    # m = Model()
    # m.SaveWorkflow()
    ...


def test_WrangleName():
    # WrangleName should produce a unique name each time
    m = Model()
    basename = "basename"
    subname = None
    names = []
    for _ in range(3):
        newname = m.WrangleName(basename, subname)
        assert newname not in names
        m.AddModule(newname, {})
    subname = "subname"
    for _ in range(3):
        newname = m.WrangleName(basename, subname)
        assert newname not in names
        m.AddModule(newname, {})


def test_WrangledNameList():
    # Produces a list of all namespaces
    m = Model()
    m.AddModule("module1", {})
    m.AddModule("module2", {})
    m.AddModule("module3", {})
    wrangledNameList = m.WrangledNameList()
    assert len(set(wrangledNameList)) == 3


def test_WrangleRuleName():
    m = Model()
    rulename_in = "replace/special.and.(remove).brackets/but_not_underscores"
    rulename_out = "replace_special_and_remove_brackets_but_not_underscores"
    assert m.WrangleRuleName(rulename_in) == rulename_out


def test_AddModule_SingleInputNamespace():
    m = Model()
    name = "module1"
    module = {
        "rulename": "module1",
        "nodetype": "moduletype1",
        "snakefile": "snakefile1",
        "params": {
            "param1": "value1",
        },
        "input_namespace": "input_namespace1",
        "output_namespace": "output_namespace1",
    }
    m.AddModule(name, module)
    # Verify module assigned correctly
    assert m.nodes[0].name == name
    assert m.nodes[0].nodetype == "moduletype1"
    # Verify module attributes assigned correctly
    for key in module:
        # output_namespace is wrangled
        if key not in ["output_namespace"]:
            assert getattr(m.nodes[0], key) == module[key]


def test_AddModule_MultipleInputNamespaces():
    m = Model()
    name = "module2"
    module = {
        "rulename": "module2",
        "nodetype": "moduletype2",
        "snakefile": "snakefile2",
        "params": {
            "param2": "value2",
        },
        "input_namespace": {
            "in2a": "input_namespace2a",
            "in2b": "input_namespace2b",
        },
        "output_namespace": "output_namespace2",
    }
    m.AddModule(name, module)
    # Verify module assigned correctly
    assert m.nodes[0].name == name
    assert m.nodes[0].nodetype == "moduletype2"
    # Verify module attributes assigned correctly
    for key in module:
        # output_namespace is wrangled
        if key not in ["output_namespace"]:
            assert getattr(m.nodes[0], key) == module[key]


def test_AddModule_DuplicateName():
    m = Model()
    m.AddModule("module", {})
    m.AddModule("module", {})
    m.AddModule("module", {})
    assert len(m.nodes) == 3
    assert len(set([n.rulename for n in m.nodes])) == 3


def test_AddConnector():
    # Namespace connector
    m = Model()
    module1 = m.AddModule("module1", {})
    module2 = m.AddModule("module2", {})
    m.AddConnector("conn12", {"map": ["module1", "module2"]})
    # Verify module namespaces connect appropriately
    assert module1.output_namespace == module2.input_namespace


def test_GetNodeByName():
    m = Model()
    node = m.AddModule("module1", {})
    assert m.GetNodeByName("module1") == node


def test_NodeIsTerminus():
    # Terminus nodes have no forward connections
    m = Model()
    node1 = m.AddModule("module1", {})  # Link to node2
    node2 = m.AddModule("module2", {})  # Link to node3
    node3 = m.AddModule("module3", {})  # No links
    node4 = m.AddModule("module4", {})  # Isolated
    m.AddConnector("conn12", {"map": ["module1", "module2"]})
    m.AddConnector("conn23", {"map": ["module2", "module3"]})
    assert m.NodeIsTerminus(node1) is False
    assert m.NodeIsTerminus(node2) is False
    assert m.NodeIsTerminus(node3)
    assert m.NodeIsTerminus(node4)


def test_YAMLToConfig():
    content = """singleton: alone
modules:
    name1: first
    name2: second
"""
    target = """config={}
config["singleton"]="alone"
config["modules"]={}
config["modules"]["name1"]="first"
config["modules"]["name2"]="second"
"""
    assert YAMLToConfig(content) == target
