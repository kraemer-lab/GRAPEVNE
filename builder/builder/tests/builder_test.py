from builder.builder import Model


def test_BuildSnakefile():
    Model.BuildSnakefile()
    ...


def test_BuildSnakefileConfig():
    Model.BuildSnakefileConfig()
    ...


def test_SaveWorkflow():
    Model.SaveWorkflow()
    ...


def test_WrangleName():
    Model.WrangleName()
    ...


def test_WrangledNameList():
    Model.WrangledNameList()
    ...


def test_WrangleRuleName():
    Model.WrangleRuleName()
    ...


def test_AddModule():
    Model.AddModule()
    ...


def test_AddConnector():
    Model.AddConnector()
    ...


def test_GetNodeByName():
    Model.GetNodeByName()
    ...


def test_NodeIsTerminus():
    Model.NodeIsTerminus()
    ...
