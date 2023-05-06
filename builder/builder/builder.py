import argparse
import json
import pathlib
import shutil
from typing import List


class Node:
    NODE_TYPES = ["Module", "Connector"]

    def __init__(
        self,
        name: str,
        rulename: str,
        nodetype: str = "Module",
        url="",
        params={},
        input_namespace: str = "",
        output_namespace: str = "",
    ):
        self.name = name
        self.rulename = rulename
        self.nodetype = nodetype
        self.url = url
        self.params = params
        self.input_namespace = input_namespace
        self.output_namespace = output_namespace

    def GetOutputNamespace(self) -> str:
        return self.output_namespace

    def GetInputNamespace(self) -> str:
        return self.input_namespace


class Module(Node):
    def __init__(self, name: str, kwargs: dict):
        super().__init__(name, **kwargs)


class Connector(Node):
    def __init__(self, name: str, kwargs: dict) -> None:
        kwargs["nodetype"] = "Connector"
        self.map: List[str] = kwargs.pop("map", "")
        super().__init__(name, **kwargs)

    def GetMapping(self) -> List[str]:
        return self.map


class Model:
    def __init__(self) -> None:
        self.nodes: List[Node] = []  # List of Node objects

    def Build(self):
        ...

    def BuildSnakefile(self):
        s = 'configfile: "config/config.yaml"\n\n'
        # Start with default rule, which lists ALL outputs
        s += "rule all:\n"
        s += "    input:\n"
        for node in self.nodes:
            # Add to terminal node if output if not connected to another module
            if node.nodetype == "Module" and self.NodeIsTerminus(node):
                s += f'        "results/{node.output_namespace}/mark",\n'
        s += "    default_target: True\n"
        s += "\n"
        # Build Snakefile
        for node in self.nodes:
            s += f"module {node.rulename}:\n"
            s += "    snakefile:\n"
            if isinstance(node.url, str):
                # Load from local file
                s += f'        "{node.url}"\n'
            else:
                # Load from github
                s += f'        {node.url["function"]}(\n'
                for arg in node.url["args"]:
                    s += f'            "{arg}",\n'
                for k, v in node.url["kwargs"].items():
                    s += f'            {k}="{v}",\n'
                s += "        )\n"
            s += f'    config: config["{node.rulename}"]\n'
            s += f"use rule * from {node.rulename} as {node.rulename}_*\n"
            s += "\n"
        return s

    def BuildSnakefileConfig(self):
        # Build config file
        c = ""
        for node in self.nodes:
            c += f"{node.rulename} :\n"
            c += f'  input_namespace : "{node.input_namespace}"\n'
            c += '  input_filename : "mark"\n'
            c += f'  output_namespace : "{node.output_namespace}"\n'
            c += '  output_filename : "mark"\n'
            # Override parameters
            for k, v in node.params.items():
                c += f'  {k} : "{v}"\n'
            c += "\n"
        return c

    def SaveWorkflow(self):
        pathlib.Path("build/config").mkdir(parents=True, exist_ok=True)
        pathlib.Path("build/workflow").mkdir(parents=True, exist_ok=True)
        with open("build/workflow/Snakefile", "w") as file:
            file.write(self.BuildSnakefile())
        with open("build/config/config.yaml", "w") as file:
            file.write(self.BuildSnakefileConfig())

    def WrangleName(self, basename: str, subname: str):
        rulename = self.WrangleRuleName(basename)
        name = f"{rulename}"
        if subname:
            name = f"{name}_{subname}"
        offset = 0
        wrangledName = f"{name}"
        while wrangledName in self.WrangledNameList():
            wrangledName = f"{name}_{hash(name + str(offset)) % (2**31)}"
            offset += 1
        return wrangledName

    def WrangledNameList(self):
        return [n.input_namespace for n in self.nodes] + [
            n.output_namespace for n in self.nodes
        ]

    def WrangleRuleName(self, name: str):
        return name.replace(" ", "_").lower()

    def AddModule(self, name: str, module: dict) -> Node:
        kwargs = module.copy()
        if "rulename" not in kwargs:
            kwargs["rulename"] = self.WrangleRuleName(name)
        node = Module(name, kwargs)
        self.nodes.append(node)
        node.input_namespace = self.WrangleName(node.name, "in")
        node.output_namespace = self.WrangleName(node.name, "out")
        return node

    def AddConnector(self, name, connector) -> Node:
        kwargs = connector.copy()
        if "rulename" not in kwargs:
            kwargs["rulename"] = self.WrangleRuleName(name)
        node = Connector(name, kwargs)
        self.nodes.append(node)
        node_in = self.GetNodeByName(node.GetMapping()[0])
        node_out = self.GetNodeByName(node.GetMapping()[1])
        node.input_namespace = node_in.GetOutputNamespace() if node_in else ""
        node.output_namespace = node_out.GetInputNamespace() if node_out else ""
        return node

    def GetNodeByName(self, name: str) -> Node | None:
        for node in self.nodes:
            if node.name == name:
                return node
        return None

    def NodeIsTerminus(self, node: Node) -> bool:
        # Check for onward connections from the given node
        for n in self.nodes:
            try:
                # Only Connectors have the map attribute
                if n.map[0] is node.name:
                    return False
            except AttributeError:
                pass
        return True


def BuildFromFile(filename: str):
    # Read JSON config file
    try:
        with open(filename, "r") as file:
            config = json.load(file)
    except FileNotFoundError:
        print(f"Configuration file not found: {filename}")
        exit(1)
    except json.decoder.JSONDecodeError:
        print(f"Invalid JSON file: {filename}")
        exit(1)

    BuildFromJSON(config)


def BuildFromJSON(config: dict):
    m = Model()
    for item in config:
        match item["type"]:
            case "Module":
                m.AddModule(
                    item["name"],
                    item["config"],
                )
            case "Connector":
                m.AddConnector(
                    item["name"],
                    item["config"],
                )
    # Create workflow directory structure
    m.SaveWorkflow()
    # Create zip archive
    zipfilename = 'build'
    shutil.make_archive(zipfilename, 'zip', 'build')
    # Load contents of zip file and return as string
    with open(f"{zipfilename}.zip", 'rb') as file:
        contents = file.read()
    return contents


if __name__ == "__main__":
    # Command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("filename", help="Filename of json configuration")
    args = parser.parse_args()
    BuildFromFile(args.filename)
