import argparse
import json
import pathlib
import re
import shutil
from typing import List
from typing import Optional
from typing import Tuple
from typing import Union

import requests
import yaml

Namespace = Union[str, None, dict]


class Node:
    """Node class for use with the workflow Model"""

    def __init__(
        self,
        name: str,
        rulename: str,
        nodetype: str,
        snakefile: Union[
            str, dict
        ] = "",  # str | {function: str, args: List, kwargs: dict}
        config={},
        input_namespace: Namespace = "",
        output_namespace: str = "",
    ):
        """Initialise a Node object, the parent class for Modules

        Args:
            name (str): Name of the node
            rulename (str): Name of the rule
            nodetype (str): Type of node (module, connector, etc.)
            snakefile (str|dict): str location or dict representing function call
            config (dict): Configuration (parameters) for the Snakefile
            input_namespace (str): Input namespace
            output_namespace (str): Output namespace
        """

        self.name = name
        self.rulename = rulename
        self.nodetype = nodetype
        self.snakefile = snakefile
        self.config = config
        self.input_namespace = input_namespace
        self.output_namespace = output_namespace

    def GetOutputNamespace(self) -> str:
        """Returns the output namespace"""
        return self.output_namespace

    def GetInputNamespace(self) -> Namespace:
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
        kwargs["nodetype"] = kwargs.get("nodetype", "module")
        kwargs["config"] = kwargs.get("config", {})
        kwargs["input_namespace"] = kwargs["config"].get("input_namespace", None)
        super().__init__(name, **kwargs)

    def _GetConfigFileinfo(self) -> Union[str, dict]:
        """Returns the config filename, or an equivalent dict for remote files"""
        workflow_filename = "workflow/Snakefile"
        config_filename = "config/config.yaml"
        if isinstance(self.snakefile, str):
            # Local file
            filename = self.snakefile
            filename = filename.replace(workflow_filename, config_filename)
            return filename
        if isinstance(self.snakefile, dict):
            # Remote file
            c = self.snakefile.copy()
            c["kwargs"]["path"] = c["kwargs"]["path"].replace(
                workflow_filename, config_filename
            )
            return c
        raise ValueError("Invalid snakefile type")

    def _ReadFile(self, fileinfo: Union[str, dict]) -> str:
        """Helper function that reads a file, either local or remote"""
        if isinstance(fileinfo, str):
            # Local file
            with open(fileinfo, "r") as file:
                contents = file.read()
            return contents
        if isinstance(fileinfo, dict):
            # Remote file
            if fileinfo.get("function", None) not in ["github"]:
                raise ValueError(
                    "Only github function is currently supported for remote files"
                )
            url_github: str = "https://raw.githubusercontent.com"
            repo = fileinfo["args"][0]
            branch = fileinfo.get("kwargs", {}).get("branch", "main")
            path = fileinfo.get("kwargs", {}).get("path", "")
            url: str = f"{url_github}/{repo}/{branch}/{path}"
            workflow_file = requests.get(url).text
            return workflow_file
        raise ValueError("Invalid snakefile type")

    def ReadWorkflowFile(self):
        return self._ReadFile(self.snakefile)

    def ReadConfigFile(self):
        return yaml.safe_load(self._ReadFile(self._GetConfigFileinfo()))


class Model:
    """Model class for the workflow"""

    def __init__(self) -> None:
        """Initialise the model"""
        self.nodes: List[Node] = []  # List of Node objects
        self.partial_build: bool = False

    def SetPartialBuild(self, partial_build: bool) -> None:
        """Sets the partial build flag (does not throw if a node is missing)"""
        self.partial_build = partial_build

    def BuildSnakefile(
        self,
        configfile: str = "config/config.yaml",
    ) -> str:
        """Builds the workflow Snakefile (links modules)"""
        s = ""
        if configfile:
            s = f'configfile: "{configfile}"\n'
        # Build Snakefile
        for node in self.nodes:
            s += "\n"
            s += f"module {node.rulename}:\n"
            s += "    snakefile:\n"
            if isinstance(node.snakefile, str):
                # String denoted a local file
                s += f'        config["{node.rulename}"]["snakefile"]\n'
            else:
                # Dynamic evaluation of function specified in config file
                s += "        eval(\n"
                s += f'            f\'{{config["{node.rulename}"]["snakefile"]["function"]}}\'\n'
                s += f'            \'(*config["{node.rulename}"]["snakefile"]["args"],\'\n'
                s += f'            \'**config["{node.rulename}"]["snakefile"]["kwargs"])\'\n'
                s += "        )\n"
            s += "    config:\n"
            s += f'        config["{node.rulename}"]["config"]\n'
            s += f"use rule * from {node.rulename} as {node.rulename}_*\n"
        return s

    def BuildSnakefileConfig(self) -> str:
        """Builds the workflow configuration as YAML"""
        c = self.ConstructSnakefileConfig()
        return yaml.dump(c)

    def ConstructSnakefileConfig(self) -> dict:
        """Builds the workflow configuration as a dictionary"""
        c: dict = {}
        c["input_namespace"] = self.ExposeOrphanInputs()
        module_output_namespaces = self.ExposeOrphanOutputs()
        # only a single output_namespace is currently supported
        if len(module_output_namespaces) == 0:
            # Model has no orphan outputs, so will form a Terminal module
            # This will most likely need marking in the config somewhere.
            ...
        if len(module_output_namespaces) == 1:
            c["output_namespace"] = module_output_namespaces[0]
        else:
            # Could support multiple output namespaces by automatically adding
            # a convergence module, but this might be better left to the user
            # as a deliberate action.
            # raise ValueError("Multiple output namespaces not currently supported. "
            #                 "Requested: ", module_output_namespaces)
            print(
                "Multiple output namespaces not currently supported. Request: ",
                module_output_namespaces,
            )
            print("Continuing for debug purposes...")
        # Add configurations for each module
        for node in self.nodes:
            cnode = node.config.copy()

            # Input namespace
            if node.input_namespace:
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
            else:
                cnode["input_namespace"] = None

            # Output namespace
            cnode["output_namespace"] = node.output_namespace

            # Save
            c[node.rulename] = {
                "name": node.name,
                "type": node.nodetype,
                "snakefile": node.snakefile,
                "config": cnode,
            }
        return c

    def SaveWorkflow(
        self,
        build_path: str = "build",
        clean_build: bool = True,
    ) -> str:
        """Saves the workflow to the build directory"""
        if clean_build:  # Delete build directory before rebuilding
            shutil.rmtree(build_path, ignore_errors=True)
        pathlib.Path(f"{build_path}/config").mkdir(parents=True, exist_ok=True)
        pathlib.Path(f"{build_path}/workflow").mkdir(parents=True, exist_ok=True)
        with open(f"{build_path}/workflow/Snakefile", "w") as file:
            file.write(self.BuildSnakefile())
        with open(f"{build_path}/config/config.yaml", "w") as file:
            file.write(self.BuildSnakefileConfig())
        return build_path

    def WrangleName(self, basename: str, subname: str = "") -> str:
        """Wrangles a valid and unique rule name"""
        rulename = self.WrangleRuleName(basename)
        name = f"{rulename}"
        if subname:
            name = f"{name}_{subname}"
        offset = 1
        wrangledName = name
        while wrangledName in self.WrangledNameList():
            # NOTE: hash is not deterministic across runs
            # wrangledName = f"{name}_{hash(name + str(offset)) % (2**31)}"
            wrangledName = f"{name}_{str(offset)}"
            offset += 1
        return wrangledName

    def WrangledNameList(self) -> List[str]:
        """Returns a list of all wrangled names"""
        return [n.rulename for n in self.nodes]

    def WrangleRuleName(self, name: str) -> str:
        """Wrangles a valid rulename (separate from the human readable name)"""
        return (
            name.replace(" ", "_")
            .replace("/", "_")
            .replace(".", "_")
            .replace("(", "")
            .replace(")", "")
            .lower()
        )

    def AddModule(self, name: str, module: dict) -> Module:
        print("=== Add module")
        print(name)
        print(module)
        """Adds a module to the workflow"""
        kwargs = module.copy()
        if "rulename" not in kwargs:
            kwargs["rulename"] = self.WrangleName(name)
        node = Module(name, kwargs)
        self.nodes.append(node)
        node.output_namespace = node.rulename
        return node

    def AddConnector(self, name, connector) -> None:
        """Adds a connection between modules

        Connectors map all inputs to a module. If the first element of
        connector is a string then only a single input_namespace need be
        considered. If the first element is a dictionary then key-value pairs
        represent the input_namespaces / ports, and their associated input
        modules.

        Example: Connect the output of module2 to the single input on module1
            connector = [ "module2", "module1" ]

        Example: Connect the output of module2 to the named input on module1
            connector = [ {"input1": "module2"}, "module1" ]

        Error behaviour depends on the partial_build flag. If False then an
        error is thrown if a node is not found. If True then the connector is
        ignored and None returned.

        Args:
            name (str): Name of the connector
            connector (list): Connector definition
        """
        mapping = connector.get("map", None)
        node_to = self.GetNodeByName(mapping[1])
        if not node_to:
            if self.partial_build:
                return
            raise ValueError(
                "No matching node found for connector source: "
                "Requested '" + mapping[1] + "'"
            )
        if isinstance(mapping[0], dict):
            assert isinstance(
                node_to.input_namespace, dict
            ), "Connector mapping is a dictionary but the destination node does not have a dictionary input namespace"
            for k, v in mapping[0].items():
                incoming_node = self.GetNodeByName(v)
                if not incoming_node:
                    if self.partial_build:
                        return
                    raise ValueError(
                        "No matching node found for connector source: " + v
                    )
                node_to.input_namespace[k] = incoming_node.output_namespace
        else:
            node_from = self.GetNodeByName(mapping[0])
            if not node_from:
                if self.partial_build:
                    return
                raise ValueError(
                    "No matching node found for connector destination: " + mapping[0]
                )
            node_to.input_namespace = node_from.output_namespace
        return None

    def GetNodeByName(self, name: str) -> Optional[Node]:
        """Returns a node object by name"""
        name = name.casefold()
        for node in self.nodes:
            if node.name.casefold() == name:
                return node
        return None

    def GetNodeByRuleName(self, rulename: str) -> Optional[Node]:
        """Returns a node object by name"""
        rulename = rulename.casefold()
        for node in self.nodes:
            if node.rulename == rulename:
                return node
        return None

    def NodeIsTerminus(self, node: Node) -> bool:
        """Returns true if the given node is a terminus"""
        # Check for onward connections from the given node
        for n in self.nodes:
            nodes_in = n.input_namespace
            if isinstance(nodes_in, str):
                nodes_in = {"in": nodes_in}
            if isinstance(nodes_in, dict):
                if node.rulename in nodes_in.values():
                    return False
        return True

    def ExposeOrphanInputs(self) -> Namespace:
        """Find orphan inputs and return as a valid input_namespace"""
        module_input_namespace: dict = {}
        all_output_namespaces = self.GetRuleNames()
        for node in self.nodes:
            ref_rulename = node.rulename + "$"
            if isinstance(node.input_namespace, str):
                if node.input_namespace not in all_output_namespaces:
                    module_input_namespace[ref_rulename] = node.input_namespace
            elif isinstance(node.input_namespace, dict):
                module_input_namespace[ref_rulename] = {}
                for k, v in node.input_namespace.items():
                    if v not in all_output_namespaces:
                        # namespace should be unique to avoid clashes
                        module_input_namespace[ref_rulename + k] = self.WrangleName(v)
                if not module_input_namespace[ref_rulename]:
                    del module_input_namespace[ref_rulename]
            elif node.input_namespace is None:
                pass
            else:
                raise ValueError("Invalid input_namespace type")
        if len(module_input_namespace) == 0:
            return None
        return module_input_namespace

    def ExposeOrphanInputsList(self) -> List[str]:
        """Find orphan inputs and return as a valid input_namespace"""
        orphans: List[str] = []
        all_output_namespaces = self.GetRuleNames()
        for node in self.nodes:
            if isinstance(node.input_namespace, str):
                if node.input_namespace not in all_output_namespaces:
                    orphans.append(node.rulename)
            elif isinstance(node.input_namespace, dict):
                for k, v in node.input_namespace.items():
                    if v not in all_output_namespaces:
                        # namespace should be unique to avoid clashes
                        orphans.append(v)
            elif node.input_namespace is None:
                # No input_namespace - source node/module
                pass
            else:
                raise ValueError("Invalid input_namespace type")
        return orphans

    def ExposeOrphanOutputs(self) -> List[str]:
        """Find orphan output and return as a valid output_namespace"""
        module_output_namespaces: List[str] = []
        all_input_namespaces = self.GetInputNamespaces()
        for node in self.nodes:
            if node.output_namespace not in all_input_namespaces:
                module_output_namespaces.append(node.rulename)
        return module_output_namespaces

    def ExpandAllModules(self) -> None:
        """Expand all modules recursively"""
        module_list: List[str] = []
        while (modules := self.GetModuleNames()) != module_list:
            module_list = modules
            for rulename in modules:
                self.ExpandModule(rulename)

    def ExpandModule(self, rulename: str):
        """Expands a module into its constituent part"""
        # Identify node
        node = self.GetNodeByRuleName(rulename)
        if not node:
            raise ValueError("No matching node found for rulename: " + rulename)
        if not isinstance(node, Module):
            raise ValueError("Node is not a module: " + rulename)
        # Read module spec (Snakefile, configfile) from source
        workflow_contents = node.ReadWorkflowFile()
        modules_list = re.findall("^module (.*):", workflow_contents, re.MULTILINE)
        config = node.ReadConfigFile()
        # Narrow list of modules to those with valid GRAPEVNE entries in config
        modules_list = [
            m
            for m in modules_list
            if (m in config)  # GRAPEVNE config entry requirements here
        ]
        if not modules_list:
            # No valid modules found, return original node
            return node

        # Keep record of orphan namespaces before expansion
        orphan_inputs_prior = self.ExposeOrphanInputsList()
        orphan_outputs_prior = self.ExposeOrphanOutputs()

        # Add new nodes
        rulemapping = {}
        new_nodes: List[Node] = []
        for n in modules_list:
            new_node = self.AddModule(n, {"config": config[n].get("config", {})})
            # Retain namespace mapping
            new_node.input_namespace = config[n]["config"].get(
                "input_namespace", new_node.input_namespace
            )
            new_node.output_namespace = config[n]["config"].get(
                "output_namespace", new_node.output_namespace
            )
            new_node.snakefile = config[n].get("snakefile", new_node.snakefile)
            # Record new node and rulename mapping, if different
            new_nodes.append(new_node)
            if n != new_node.rulename:
                rulemapping[n] = new_node.rulename

        print(
            "Attempting to expand module",
            node.rulename,
            " from ",
            modules_list,
            " into ",
            [n.rulename for n in new_nodes],
        )

        # Ensure namespace consistency between new nodes after rename
        for n in new_nodes:
            # output_namespace
            if n.output_namespace in rulemapping.keys():
                n.output_namespace = rulemapping[n.output_namespace]
            # input_namespace
            if isinstance(n.input_namespace, str):
                if n.input_namespace in rulemapping.keys():
                    n.input_namespace = rulemapping[n.input_namespace]
            elif isinstance(n.input_namespace, dict):
                for k, v in n.input_namespace.items():
                    if k in rulemapping.keys():
                        n.input_namespace[k] = rulemapping[v]
            elif n.input_namespace is None:
                pass
            else:
                raise ValueError("Namespace type not recognised")

        # Find orphan inputs and outputs from new node network
        # Sort to prevent reording of nodes that afffect rule name wrangling
        #  (important for testing)
        new_orphan_inputs = sorted(
            list(set(self.ExposeOrphanInputsList()) - set(orphan_inputs_prior))
        )
        new_orphan_outputs = sorted(
            list(set(self.ExposeOrphanOutputs()) - set(orphan_outputs_prior))
        )
        assert (
            len(new_orphan_outputs) <= 1
        ), "More than one new orphan output found: " + str(new_orphan_outputs)

        # Preserve incoming connections to parent node
        if len(new_orphan_inputs) == 0:
            # Now orphan inputs - source module
            node.input_namespace = None
        elif isinstance(node.input_namespace, str):
            orphan_node = self.GetNodeByRuleName(list(new_orphan_inputs)[0])
            if orphan_node:
                orphan_node.input_namespace = node.input_namespace
            else:
                raise ValueError(
                    "No matching node found for name: " + list(new_orphan_inputs)[0]
                )
        elif isinstance(node.input_namespace, dict):
            # raise ValueError("Input dictionary namespaces not supported yet")
            print("Input dictionary namespaces not supported yet")
            print("Continuing for debug purposes...")
        elif node.input_namespace is None:
            # Module is a Source and (no incoming connections)
            pass
        else:
            raise ValueError("Namespace type not recognised")

        # Preserve outgoing connections from parent node
        for n in self.nodes:
            if isinstance(n.input_namespace, str):
                if n.input_namespace == node.output_namespace:
                    assert len(new_orphan_outputs) == 1, (
                        "Expanding node has one input, but "
                        + str(len(new_orphan_outputs))
                        + " new orphan outputs found"
                    )
                    n.input_namespace = list(new_orphan_outputs)[0]
            elif isinstance(n.input_namespace, dict):
                for k, v in n.input_namespace.items():
                    if v == node.output_namespace:
                        n.input_namespace[k] = list(new_orphan_outputs)[0]
            elif n.input_namespace is None:
                pass
            else:
                raise ValueError("Namespace type not recognised")

        # Remove expanded node from model
        self.nodes.remove(node)

        # Return new nodes
        return new_nodes

    def GetModuleNames(self) -> List[str]:
        return [n.rulename for n in self.nodes if isinstance(n, Module)]

    def GetInputNamespaces(self) -> List[str]:
        input_namespaces: List[str] = []
        for n in self.nodes:
            if isinstance(n.input_namespace, str):
                input_namespaces.append(n.input_namespace)
            elif isinstance(n.input_namespace, dict):
                for k, v in n.input_namespace.items():
                    input_namespaces.append(v)
            elif n.input_namespace is None:
                continue
            else:
                raise ValueError("Namespace type not recognised")
        return [name for name in input_namespaces if name]

    def GetRuleNames(self) -> List[str]:
        return [n.rulename for n in self.nodes]


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


def BuildFromFile(
    filename: str, **kwargs
) -> Tuple[Union[Tuple[str, str], bytes], Model]:
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
    return BuildFromJSON(config, **kwargs)


def CleanBuildFolder(build_path: str = "") -> None:
    """Deletes the build folder, if it exists"""
    shutil.rmtree(build_path, ignore_errors=True)


def BuildFromJSON(
    config: dict,
    singlefile: bool = False,
    expand: bool = True,
    build_path: str = "",
    clean_build: bool = True,
    partial_build: bool = False,  # Don't throw an error if node is missing
) -> Tuple[Union[Tuple[str, str], bytes], Model]:
    """Builds a workflow from a JSON specification

    Returns a tuple of the workflow and the workflow model object.
    With singlefile=True the workflow is a tuple of (config, snakefile) strings
    With singlefile=False the workflow is a (zipped) directory structure.
    """
    m = Model()
    m.SetPartialBuild(partial_build)
    # Add modules first to ensure all namespaces are defined before connectors
    for item in config:
        if item["type"].casefold() in ["module", "source", "terminal"]:
            print("=== Add module (call)")
            print(item)
            m.AddModule(
                item["name"],
                item["config"],
            )
    # Add connectors
    for item in config:
        if item["type"].casefold() in ["connector"]:
            m.AddConnector(
                item["name"],
                item["config"],
            )
    if expand:
        m.ExpandAllModules()
    if singlefile:
        # Return composite string
        return ((m.BuildSnakefileConfig(), m.BuildSnakefile())), m
    else:
        # Create (zipped) workflow and return as binary object
        build_path = m.SaveWorkflow(build_path, clean_build)
        zipfilename = "build"
        shutil.make_archive(zipfilename, "zip", build_path)
        with open(f"{zipfilename}.zip", "rb") as file:
            contents = file.read()
        return contents, m


if __name__ == "__main__":
    """Builds a workflow given a JSON specification file"""
    parser = argparse.ArgumentParser()
    parser.add_argument("filename", help="Filename of json configuration")
    args = parser.parse_args()
    BuildFromFile(args.filename)
