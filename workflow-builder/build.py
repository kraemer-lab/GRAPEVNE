import pathlib
from typing import List


class Node:
    _NodeTypes = ["Module", "Connector"]

    name: str = ""
    rulename: str = ""
    nodetype: str = ""
    url: dict = {}
    input_namespace: str = ""
    output_namespace: str = ""

    def __init__(
        self,
        name,
        rulename,
        nodetype="Module",
        url: dict = {},
        input_namespace: str = "",
        output_namespace: str = "",
    ):
        self.name = name
        self.rulename = rulename
        self.nodetype = nodetype
        self.url = url
        self.input_namespace = input_namespace
        self.output_namespace = output_namespace


class Module(Node):
    def __init__(self, name, kwargs):
        super().__init__(name, **kwargs)


class Connector(Node):
    mapping: List[Node] = []

    def __init__(self, name, kwargs):
        self.mapping = kwargs.pop('map', None)
        super().__init__(name, **kwargs)


class Model:
    nodes: List[Node] = []  # List of Node objects
    default_node: Node = None

    def __init__(self):
        ...

    def Build(self):
        ...

    def BuildSnakefile(self):
        # Build Snakefile
        s = 'configfile: "config/config.yaml"\n\n'
        for node in self.nodes:
            s += f'module {node.rulename}:\n'
            s += '    snakefile:\n'
            s += f'        {node.url["function"]}(\n'
            for arg in node.url["args"]:
                s += f'            "{arg}",\n'
            for k, v in node.url["kwargs"].items():
                s += f'            {k}="{v}",\n'
            s += '        )\n'
            s += f'    config: config["{node.rulename}"]\n'
            s += f'use rule * from {node.rulename} as {node.rulename}_*\n'
            s += '\n'
        return s

    def BuildSnakefileConfig(self):
        # Build config file
        c = ""
        for node in self.nodes:
            c += f'{node.rulename} :\n'
            c += f'  input_namespace : "{node.input_namespace}"\n'
            c += '  input_filename : "mark"\n'
            c += f'  output_namespace : "{node.output_namespace}"\n'
            c += '  output_filename : "mark"\n'
            c += '\n'
        return c

    def SaveWorkflow(self):
        pathlib.Path("build/config").mkdir(parents=True, exist_ok=True)
        pathlib.Path("build/workflow").mkdir(parents=True, exist_ok=True)
        with open("build/workflow/Snakefile", "w") as file:
            file.write(self.BuildSnakefile())
        with open("build/config/config.yaml", "w") as file:
            file.write(self.BuildSnakefileConfig())

    def WrangleName(self, basename: str, subname: str):
        name = f"_{basename}"
        if subname:
            name = f"{name}_{subname}"
        offset = 0
        while (
            wrangledName := f"{name}_{hash(name + str(offset)) % (2**31)}"
        ) in self.WrangledNameList():
            offset += 1
        return wrangledName

    def WrangledNameList(self):
        return [n.input_namespace for n in self.nodes] \
            + [n.output_namespace for n in self.nodes]

    def WrangleRuleName(self, name: str):
        return name.replace(' ', '_').lower()

    def AddModule(self, name: str, module: dict):
        kwargs = module.copy()
        if 'rulename' not in kwargs:
            kwargs['rulename'] = self.WrangleRuleName(name)
        node = Module(name, kwargs)
        self.nodes.append(node)
        node.input_namespace = self.WrangleName(node.name, "in")
        node.output_namespace = self.WrangleName(node.name, "out")
        # Make last module the default node, if not already specified
        if not self.default_node:
            self.MakeDefault(node)

    def AddConnector(self, name, connector):
        kwargs = connector.copy()
        if 'rulename' not in kwargs:
            kwargs['rulename'] = self.WrangleRuleName(name)
        node = Connector(name, kwargs)
        self.nodes.append(node)
        node.input_namespace = self.WrangleName(node.name, "in")
        node.output_namespace = self.WrangleName(node.name, "out")

    def MakeDefault(self, node):
        self.default_node = node


if __name__ == "__main__":
    def module(path: str):
        return {
            "url": {
                "function": "github",
                "args": ["jsbrittain/snakeshack"],
                "kwargs": {
                    "path": f"workflows/{path}/workflow/Snakefile",
                    "branch": "main",
                },
            },
        }

    def connector(path: str, mapping: List):
        m = module(path)
        m['map'] = mapping
        return m

    m = Model()
    node0 = m.AddModule("Start", module("OxfordPhyloGenetics/connector_start"))
    node1 = m.AddModule("Sleep 1", module("OxfordPhyloGenetics/sleep"))
    node2 = m.AddModule("Sleep 2", module("OxfordPhyloGenetics/sleep"))
    node3 = m.AddModule("Sleep 3", module("OxfordPhyloGenetics/sleep"))
    m.AddConnector(
        "Connector 01",
        connector("OxfordPhyloGenetics/connector_copy", [node0, node1]))
    m.AddConnector(
        "Connector 12",
        connector("OxfordPhyloGenetics/connector_copy", [node1, node2]))
    m.AddConnector(
        "Connector 23",
        connector("OxfordPhyloGenetics/connector_copy", [node2, node3]))
    m.SaveWorkflow()
