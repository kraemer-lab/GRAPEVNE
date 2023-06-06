import argparse
import json
import pathlib
import shutil
from typing import List

import yaml


class Node:
    """Node class for use with the workflow Model"""

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
        """Initialise a Node object, the parent class for Modules, Connector, etc.

        Args:
            name (str): Name of the node
            rulename (str): Name of the rule
            nodetype (str): Type of node (module, connector, etc.)
            url (str): URL of the Snakefile
            params (dict): Parameters for the Snakefile
            input_namespace (str): Input namespace
            output_namespace (str): Output namespace
        """

        self.name = name
        self.rulename = rulename
        self.nodetype = nodetype
        self.url = url
        self.params = params if params else {}
        self.input_namespace = input_namespace
        self.output_namespace = output_namespace

    def GetOutputNamespace(self) -> str:
        """Returns the output namespace"""
        return self.output_namespace

    def GetInputNamespace(self) -> str | dict:
        """Returns the input namespace, which can be a string or dictionary"""
        return self.input_namespace


class Module(Node):
    """Module class for use with the workflow Model"""

    def __init__(self, name: str, kwargs: dict):
        """Initialise a Module object

        Args:
            name (str): Name of the module
            kwargs: See Node class for kwargs
        """
        super().__init__(name, **kwargs)


class Connector(Node):
    """Connector class for use with the workflow Model"""

    def __init__(self, name: str, kwargs: dict) -> None:
        """Initialise a Module object

        Args:
            name (str): Name of the module
            kwargs: See Node class for kwargs
        """
        kwargs["nodetype"] = "connector"
        self.map: List[str] = kwargs.pop("map", "")
        super().__init__(name, **kwargs)

    def GetMapping(self) -> List[str]:
        """Returns the mapping"""
        return self.map


class Model:
    """Model class for the workflow"""

    def __init__(self) -> None:
        """Initialise the model"""
        self.nodes: List[Node] = []  # List of Node objects

    def BuildSnakefile(
        self,
        configfile: str = "config/config.yaml",
    ):
        """Builds the workflow Snakefile (links modules)"""
        s = ""
        if configfile:
            s = f'configfile: "{configfile}"\n\n'
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
        """Builds the workflow configuration as YAML"""
        c = self.ConstructSnakefileConfig()
        return yaml.dump(c)

    def ConstructSnakefileConfig(self):
        """Builds the workflow configuration as a dictionary"""
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
        return c

    def SaveWorkflow(self):
        """Saves the workflow to the build directory"""
        pathlib.Path("build/config").mkdir(parents=True, exist_ok=True)
        pathlib.Path("build/workflow").mkdir(parents=True, exist_ok=True)
        with open("build/workflow/Snakefile", "w") as file:
            file.write(self.BuildSnakefile())
        with open("build/config/config.yaml", "w") as file:
            file.write(self.BuildSnakefileConfig())

    def WrangleName(self, basename: str, subname: str = ""):
        """Wrangles a valid and unique rule name"""
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
        """Returns a list of all wrangled names"""
        return [n.output_namespace for n in self.nodes]

    def WrangleRuleName(self, name: str):
        """Wrangles a valid rulename (separate from the human readable name)"""
        return (
            name.replace(" ", "_")
            .replace("/", "_")
            .replace(".", "_")
            .replace("(", "")
            .replace(")", "")
            .lower()
        )

    def AddModule(self, name: str, module: dict) -> Node:
        """Adds a module to the workflow"""
        kwargs = module.copy()
        if "rulename" not in kwargs:
            kwargs["rulename"] = self.WrangleRuleName(name)
        node = Module(name, kwargs)
        self.nodes.append(node)
        node.output_namespace = self.WrangleName(node.name)
        return node

    def AddConnector(self, name, connector) -> Node | None:
        """Adds a connector to the workflow"""
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
                    node_to.input_namespace[k] = self.GetNodeByName(v).output_namespace
            else:
                node_from = self.GetNodeByName(mapping[0])
                if not node_from:
                    raise ValueError("No matching node found for connector destination")
                node_to.input_namespace = node_from.output_namespace
            return None

    def GetNodeByName(self, name: str) -> Node | None:
        """Returns a node object by name"""
        for node in self.nodes:
            if node.name == name:
                return node
        return None

    def NodeIsTerminus(self, node: Node) -> bool:
        """Returns true if the given node is a terminus"""
        # Check for onward connections from the given node
        for n in self.nodes:
            # Check Connector 'map' attribute for onward connections
            if isinstance(n, Connector):
                nodes_from = getattr(n, "map", None)
                if not isinstance(nodes_from, list):
                    nodes_from = [nodes_from]
                if node.name in nodes_from:
                    return False
            # Check module input namespaces for onward connections
            if isinstance(n, Module):
                nodes_in = n.input_namespace
                if isinstance(nodes_in, str):
                    nodes_in = {"in": nodes_in}
                if node.name in nodes_in.values():
                    return False
        return True


def YAMLToConfig(content: str) -> str:
    """Transcribes YAML to a (Snakemake readable) dictionary config syntax"""
    yl = yaml.safe_load(content)

    def parse_struct(yl: dict):
        """Recursively parses a YAML structure"""
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
    return c


def BuildFromFile(filename: str):
    """Builds a workflow from a JSON specification file"""
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
    """Builds a workflow from a JSON specification

    Returns a tuple of the workflow and the workflow model object.
    With singlefile=True the workflow is a self-contained string.
    With singlefile=False the workflow is a (zipped) directory structure.
    """
    m = Model()
    # Add modules first to ensure all namespaces are defined before connectors
    for item in config:
        match item["type"].casefold():
            case "module" | "source" | "terminal":
                m.AddModule(
                    item["name"],
                    item["config"],
                )
    # Add connectors
    for item in config:
        match item["type"].casefold():
            case "connector":
                m.AddConnector(
                    item["name"],
                    item["config"],
                )
    if singlefile:
        # Return composite string
        return (
            YAMLToConfig(m.BuildSnakefileConfig())
            + "\n"
            + m.BuildSnakefile(configfile="")
        ), m
    else:
        # Create (zipped) workflow and return as binary object
        m.SaveWorkflow()
        zipfilename = "build"
        shutil.make_archive(zipfilename, "zip", "build")
        with open(f"{zipfilename}.zip", "rb") as file:
            contents = file.read()
        return contents, m


if __name__ == "__main__":
    """Builds a workflow given a JSON specification file"""
    parser = argparse.ArgumentParser()
    parser.add_argument("filename", help="Filename of json configuration")
    args = parser.parse_args()
    BuildFromFile(args.filename)
