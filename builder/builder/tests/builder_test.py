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
    # m = Model()
    # m.WrangleName()
    ...


def test_WrangledNameList():
    # m = Model()
    # m.WrangledNameList()
    ...


def test_WrangleRuleName():
    # m = Model()
    # m.WrangleRuleName()
    ...


def test_AddModule():
    # m = Model()
    # m.AddModule()
    ...


def test_AddConnector():
    # m = Model()
    # m.AddConnector()
    ...


def test_GetNodeByName():
    # m = Model()
    # m.GetNodeByName()
    ...


def test_NodeIsTerminus():
    # m = Model()
    # m.NodeIsTerminus()
    ...


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
