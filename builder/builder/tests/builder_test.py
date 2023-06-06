from builder.builder import Model
from builder.builder import YAMLToConfig


def test_BuildSnakefile():
    # m = Model()
    # m.BuildSnakefile()
    ...


def test_BuildSnakefileConfig():
    # m = Model()
    # m.BuildSnakefileConfig()
    ...


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
        "rulename": "rulename1",
        "nodetype": "moduletype1",
        "url": "url1",
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
        "rulename": "rulename2",
        "nodetype": "moduletype2",
        "url": "url2",
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


def test_AddConnector():
    # m = Model()
    # m.AddConnector()
    ...


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
