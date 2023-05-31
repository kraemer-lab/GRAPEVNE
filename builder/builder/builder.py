import argparse
import json
import pathlib
import shutil
from typing import List

import yaml


class Node:
    NODE_TYPES = ["module", "connector"]

    def __init__(
        self,
        name: str,
        rulename: str,
        nodetype: str = "module",
        url="",
        params={},
        input_namespace: str | dict = "",
        output_namespace: str = "",
    ):
        self.name = name
        self.rulename = rulename
        self.nodetype = nodetype
        self.url = url
        self.params = params if params else {}
        self.input_namespace = input_namespace
        self.output_namespace = output_namespace

    def GetOutputNamespace(self) -> str:
        return self.output_namespace

    def GetInputNamespace(self) -> str | dict:
        return self.input_namespace


class Module(Node):
    def __init__(self, name: str, kwargs: dict):
        super().__init__(name, **kwargs)


class Connector(Node):
    def __init__(self, name: str, kwargs: dict) -> None:
        kwargs["nodetype"] = "connector"
        self.map: List[str] = kwargs.pop("map", "")
        super().__init__(name, **kwargs)

    def GetMapping(self) -> List[str]:
        return self.map


class Model:
    def __init__(self) -> None:
        self.nodes: List[Node] = []  # List of Node objects

    def BuildSnakefile(
        self,
        configfile: str = "config/config.yaml",
        allrule: bool = True,
    ):
        s = ""
        if configfile:
            s = f'configfile: "{configfile}"\n\n'
        # Start with default rule, which lists ALL outputs
        # if allrule:
        #    s += "rule all:\n"
        #    s += "    input:\n"
        #    for node in self.nodes:
        #        # Add to terminal node if output if not connected to another module
        #        if node.nodetype.casefold() == "module" and self.NodeIsTerminus(node):
        #            s += f'        "results/{node.GetOutputFilepath()}",\n'
        #    s += "    default_target: True\n"
        #    s += "\n"
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
        c = {}
        for node in self.nodes:
            cnode = node.params.copy()

            # Input namespace
            cnode["input_namespace"] = cnode.get(
                "input_namespace", node.input_namespace
            )
            if isinstance(cnode["input_namespace"], dict):
                if not isinstance(node.input_namespace, dict):
                    node.input_namespace = {}
                for k, v in cnode["input_namespace"].items():
                    if node.input_namespace.get(k, None):
                        cnode["input_namespace"][k] = node.input_namespace[k]
                    # Don't use 'null' for input namespaces
                    if not cnode["input_namespace"][k]:
                        cnode["input_namespace"][k] = k
            if isinstance(node.input_namespace, str):
                cnode["input_namespace"] = node.input_namespace

            # Output namespace
            cnode["output_namespace"] = node.output_namespace

            # Save
            c[node.rulename] = cnode
        return yaml.dump(c)

    def SaveWorkflow(self):
        pathlib.Path("build/config").mkdir(parents=True, exist_ok=True)
        pathlib.Path("build/workflow").mkdir(parents=True, exist_ok=True)
        with open("build/workflow/Snakefile", "w") as file:
            file.write(self.BuildSnakefile())
        with open("build/config/config.yaml", "w") as file:
            file.write(self.BuildSnakefileConfig())

    def WrangleName(self, basename: str, subname: str = ""):
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
        return (
            name.replace(" ", "_")
            .replace("/", "_")
            .replace(".", "_")
            .replace("(", "")
            .replace(")", "")
            .lower()
        )

    def AddModule(self, name: str, module: dict) -> Node:
        kwargs = module.copy()
        if "rulename" not in kwargs:
            kwargs["rulename"] = self.WrangleRuleName(name)
        node = Module(name, kwargs)
        self.nodes.append(node)
        node.output_namespace = self.WrangleName(node.name)
        return node

    def AddConnector(self, name, connector) -> Node | None:
        if connector.get("url", None):
            # url specified - add node
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
        else:
            # no url specified - join namespaces
            mapping = connector.get("map", None)
            node_to = self.GetNodeByName(mapping[1])
            if not node_to:
                raise ValueError("No matching node found for connector source")
            if isinstance(mapping[0], dict):
                node_to.input_namespace = {}
                for k, v in mapping[0].items():
                    print("---")
                    print(v)
                    node_to.input_namespace[k] = self.GetNodeByName(v).output_namespace
            else:
                node_from = self.GetNodeByName(mapping[0])
                if not node_from:
                    raise ValueError("No matching node found for connector destination")
                node_to.input_namespace = node_from.output_namespace
            return None

    def GetNodeByName(self, name: str) -> Node | None:
        for node in self.nodes:
            print(node.name)
            if node.name == name:
                return node
        return None

    def NodeIsTerminus(self, node: Node) -> bool:
        # Check for onward connections from the given node
        for n in self.nodes:
            # Only Connectors have the 'map' attribute
            if getattr(n, "map", None) is node.name:
                return False
        return True


def YAMLToConfig(content: str) -> str:
    yl = yaml.safe_load(content)

    def parse_struct(yl: dict):
        c = ""
        for key, value in yl.items():
            if isinstance(value, dict):
                vv = parse_struct(value)
                vv = [v for v in vv.split("\n") if v]
                c += f'["{key}"]={{}}\n'  # Create empty dict
                c += "\n".join([f'["{key}"]{v}' for v in vv]) + "\n"
            elif isinstance(value, list):
                raise Exception("Lists not supported in config")
            elif not value:
                # Null
                c += f'["{key}"]="None"\n'
            else:
                # Some primitive type
                c += f'["{key}"]="{value}"\n'
        return c

    c = parse_struct(yl)
    c = ["config" + s for s in c.split("\n") if s]
    c = "\n".join(c) + "\n"
    c = "config={}\n" + c
    print(c)
    return c


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


def BuildFromJSON(config: dict, singlefile: bool = False):
    m = Model()
    # Add modules first to ensure all namespaces are defined
    for item in config:
        match item["type"].casefold():
            case "module" | "source" | "terminal":
                m.AddModule(
                    item["name"],
                    item["config"],
                )
    for item in config:
        match item["type"].casefold():
            case "connector":
                m.AddConnector(
                    item["name"],
                    item["config"],
                )
    if singlefile:
        return (
            YAMLToConfig(m.BuildSnakefileConfig())
            + "\n"
            + m.BuildSnakefile(configfile="", allrule=False)
        )
    else:
        # Create workflow directory structure
        m.SaveWorkflow()
        # Create zip archive
        zipfilename = "build"
        shutil.make_archive(zipfilename, "zip", "build")
        # Load contents of zip file and return as string
        with open(f"{zipfilename}.zip", "rb") as file:
            contents = file.read()
        return contents


if __name__ == "__main__":
    # Command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("filename", help="Filename of json configuration")
    args = parser.parse_args()
    BuildFromFile(args.filename)
