import argparse
import builtins
import copy
import json
import logging
import os
import pathlib
import re
import shutil
import tempfile
from typing import List
from typing import Optional
from typing import Tuple
from typing import Union

import cachetools
import requests
import yaml
from grapevne.defs import get_port_spec
from grapevne.defs import Module as Node
from grapevne.defs import Port
from grapevne.defs import Snakefile

from .quoted_yaml import quoted_yaml_dump
from .workflow_alerts import ProcessWorkflowAlerts
from .workflow_alerts import WorkflowAlerts

Ports = [Port]


# Set up logging
logfile = os.path.expanduser("~") + "/.GRAPEVNE.log"
logging.basicConfig(
    filename=logfile,
    encoding="utf-8",
    level=logging.DEBUG,
)
logging.info("Working directory: %s", os.getcwd())


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
        kwargs["ports"] = kwargs["config"].get("ports", None)
        super().__init__(name, **kwargs)

    def _GetConfigFileinfo(self) -> Snakefile:
        """Returns the config filename, or an equivalent dict for remote files"""
        if isinstance(self.snakefile, str):
            # Local file
            workflow_filename = os.path.join("workflow", "Snakefile")
            config_filename = os.path.join("config", "config.yaml")
            filename = self.snakefile
            filename = filename.replace(workflow_filename, config_filename)
            return filename
        if isinstance(self.snakefile, dict):
            # Remote file
            workflow_filename = "workflow/Snakefile"
            config_filename = "config/config.yaml"
            c = copy.deepcopy(self.snakefile)
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
        self.alerts: WorkflowAlerts = None
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
                s += f'        globals().get(config["{node.rulename}"]["snakefile"]["function"])(\n'
                s += f'            *config["{node.rulename}"]["snakefile"]["args"],\n'
                s += (
                    f'            **config["{node.rulename}"]["snakefile"]["kwargs"],\n'
                )
                s += "        )\n"
            s += "    config:\n"
            s += f'        config["{node.rulename}"]["config"]\n'
            s += f"use rule * from {node.rulename} exclude _test as {node.rulename}_*\n"
            s += self.AddWorkflowAlerts()
        return s

    def AddWorkflowAlerts(self) -> str:
        """Adds workflow alerts (email) to the Snakefile"""
        if not self.alerts:
            return ""
        if not self.alerts.email_settings:
            return ""
        if not self.alerts.onsuccess or not self.alerts.onerror:
            return ""

        smtp_address = self.alerts.email_settings.smtp_address
        smtp_port = self.alerts.email_settings.smtp_port
        username = (
            # Look for environment variables if username not pre-defined
            f'"{self.alerts.email_settings.username}"'
            if self.alerts.email_settings.username
            else "os.environ.get('GRAPEVNE_EMAIL_USERNAME')"
        )
        password = (
            # Look for environment variables if password not pre-defined
            f'"{self.alerts.email_settings.password}"'
            if (
                self.alerts.email_settings.username
                and self.alerts.email_settings.password
            )
            else "os.environ.get('GRAPEVNE_EMAIL_PASSWORD')"
        )
        sender = (
            # Use username as sender if not defined
            f'"{self.alerts.email_settings.sender}"'
            if self.alerts.email_settings.sender
            else username
        )

        def create_alert(
            directive,
            subject,
            body,
            recipients,
        ) -> str:
            s = "\n"
            s += f"{directive}:\n"
            s += "    try:\n"  # don't fail the run because of the workflow alert
            s += "        import sendmail\n"
            s += "        sendmail.send_email(\n"
            s += f'            server_address="{smtp_address}",\n'
            s += f'            server_port="{smtp_port}",\n'
            s += f'            subject="{subject}",\n'
            s += f'            body="{body}",\n'
            s += f"            sender={sender},\n"  # don't quote (see below)
            s += f'            recipients="{recipients}",\n'
            s += f"            username={username},\n"  # don't quote as can be used to
            s += f"            password={password},\n"  # get environment variables
            s += "        )\n"
            s += "    except Exception as e:\n"
            s += '        print("Error sending email: ", e)\n'
            return s

        s = ""
        if self.alerts.onsuccess:
            s += create_alert(
                "onsuccess",
                self.alerts.onsuccess.subject,
                self.alerts.onsuccess.body,
                self.alerts.onsuccess.recipients,
            )
        if self.alerts.onerror:
            s += create_alert(
                "onerror",
                self.alerts.onerror.subject,
                self.alerts.onerror.body,
                self.alerts.onerror.recipients,
            )

        return s

    def BuildSnakefileConfig(self) -> str:
        """Builds the workflow configuration as YAML"""
        c = self.ConstructSnakefileConfig()
        return quoted_yaml_dump(c, sort_keys=False, default_flow_style=False)

    def ResolveLinkValue(self, metadata: dict):
        """Resolves a link value"""
        link_from = metadata["link"]
        link_module = link_from[0]
        linked_module = self.GetNodeByName(link_module)
        if not linked_module:
            linked_module = self.GetNodeByRuleName(link_module)
            if not linked_module:
                raise ValueError(
                    "No matching node found for link source: " + link_from[0]
                )
        assert link_from[1] == "config"
        config_from = linked_module.config
        link_path = link_from[2:-1]
        for link in link_path:
            config_from = config_from[link]
        value = config_from[link_from[-1]]
        metadata_name = ":" + link_from[-1]
        # If metadata is present, use it
        if config_from.get(metadata_name, None):
            metadata = config_from[metadata_name]
            if metadata.get("link", None):
                # Resolve link value
                value = self.ResolveLinkValue(metadata)
        return value

    def ResolveParameterLinks(self, cnode) -> dict:
        """Resolves parameter links in the configuration file"""
        cnode_updated = cnode.copy()
        for k, v in cnode.items():
            if k.startswith(":"):
                param_name = k[1:]
                if v.get("link", None):
                    value = self.ResolveLinkValue(v)
                    cnode_updated[param_name] = value
            elif isinstance(v, dict):
                cnode_updated[k] = self.ResolveParameterLinks(v)
        return cnode_updated

    def ConstructSnakefileConfig(self) -> dict:
        """Builds the workflow configuration as a dictionary"""
        c: dict = {}
        c["ports"] = self.ExposeOrphanInputs()
        module_namespaces = self.ExposeOrphanOutputs()
        # only a single namespace is currently supported
        if len(module_namespaces) == 0:
            # Model has no orphan outputs, so will form a Terminal module
            # This will most likely need marking in the config somewhere.
            # TODO
            ...
        elif len(module_namespaces) == 1:
            c["namespace"] = module_namespaces[0]
        else:
            logging.warn(
                "Multiple output namespaces not currently supported. Requested: "
                f"{module_namespaces}",
            )
            c["namespace"] = module_namespaces[0]
        # Add configurations for each module
        for node in self.nodes:
            cnode = node.config.copy()
            cnode = self.ResolveParameterLinks(cnode)

            # Input namespace
            if node.ports:
                cnode["ports"] = cnode.get("ports", node.ports)
            else:
                cnode["ports"] = []

            # Output namespace
            cnode["namespace"] = node.namespace

            # Save
            c[node.rulename] = {
                "name": node.name,
                "type": node.nodetype,
                "snakefile": node.snakefile,
                "config": cnode,
            }
        return c

    @staticmethod
    def PackageModule_Local(build_path: str, node: Node) -> None:
        """Packages a local module into the build directory

        Assumes node.snakemake is a string representing the path to the module
        """
        # Identify local folder structure
        if not isinstance(node.snakefile, str):
            raise ValueError("Local module configuration expected")
        m_path = os.path.dirname(os.path.normpath(node.snakefile))
        try:
            m_pathlist = m_path.split(os.path.sep)
            (
                m_repo_name,
                m_workflows_foldername,
                m_project_foldername,
                m_type_foldername,
                m_modulename_foldername,
                m_workflow_foldername,
            ) = m_pathlist[-6:]
            if m_workflows_foldername != "workflows":
                raise IndexError
        except IndexError:
            raise ValueError("Module Snakefile is not in the expected folder structure")
        # Recreate folder structure in the build directory
        dest = pathlib.Path(
            build_path,
            "workflow",  # base 'workflow' folder
            "modules",  # packaged modules are stored in a 'modules' sub-folder
            "local",  # local modules are stored in a 'local' sub-folder (equiv. owner)
            m_repo_name,  # imported module root folder (equivalent to repo name)
            "workflows",
            m_project_foldername,
            m_type_foldername,
            m_modulename_foldername,
        )
        src = os.path.normpath(pathlib.Path(m_path, os.pardir))
        pathlib.Path(dest).mkdir(parents=True, exist_ok=True)
        # Copy module to the build directory
        ignore_in_root = ["results", "logs", "benchmarks"]
        ignore_anywhere = [".snakemake", "__pycache__", ".test.sh", ".test.yaml"]
        folders_in_root = os.listdir(src)
        keep_folders = set(folders_in_root) - set(ignore_in_root)
        for folder in keep_folders:
            src_folder = pathlib.Path(src, folder)
            dest_folder = pathlib.Path(dest, folder)
            if src_folder.is_file():
                shutil.copy2(src_folder, dest_folder)
            else:
                shutil.copytree(
                    src_folder,
                    dest_folder,
                    dirs_exist_ok=True,
                    ignore=lambda directory, contents: contents
                    if any(map(directory.endswith, ignore_anywhere))
                    else set(),
                )
        # Redirect snakefile location in config
        node.snakefile = str(
            pathlib.Path(
                "modules",
                "local",
                m_repo_name,
                "workflows",
                m_project_foldername,
                m_type_foldername,
                m_modulename_foldername,
                m_workflow_foldername,
                "Snakefile",
            )
        )

    @staticmethod
    def PackageModule_Remote(build_path: str, node: Node) -> None:
        """Packages a remote module into the build directory"""
        # Validate node.snakemake
        if not isinstance(node.snakefile, dict):
            raise ValueError(
                "Remote module configuration expected, got: " + str(node.snakefile)
            )
        if node.snakefile["function"] not in ["github"]:
            raise ValueError(
                "Only github function is currently supported, got: "
                + node.snakefile["function"]
            )
        if not any(
            [k in node.snakefile["kwargs"] for k in ["branch", "tag", "commit"]]
        ):
            raise ValueError(
                "Remote module requires a branch, tag or commit to be specified, "
                f"kwargs: {node.snakefile['kwargs']}"
            )
        if "path" not in node.snakefile["kwargs"]:
            raise ValueError(
                "Remote module requires a path to be specified, kwargs: "
                + str(node.snakefile["kwargs"])
            )
        # Identify remote folder structure
        m_path = node.snakefile["kwargs"]["path"]
        try:
            m_pathlist = m_path.split(os.path.sep)[:-1]
            (
                *m_base_path,
                m_workflows_foldername,
                m_project_foldername,
                m_type_foldername,
                m_modulename_foldername,
                m_workflow_foldername,
            ) = m_pathlist
            if m_workflows_foldername != "workflows":
                raise IndexError
            m_repo_name = os.path.join(*node.snakefile["args"][0].split("/"))
        except IndexError:
            raise ValueError("Module Snakefile is not in the expected folder structure")
        # Recreate folder structure in the build directory
        dest = pathlib.Path(
            build_path,
            "workflow",  # base 'workflow' folder
            "modules",  # downloaded modules are stored in a 'modules' sub-folder
            m_repo_name,
        )
        pathlib.Path(dest).mkdir(parents=True, exist_ok=True)
        branch = node.snakefile["kwargs"].get("branch", None)
        if not branch:
            branch = node.snakefile["kwargs"].get("tag", None)
        if not branch:
            branch = node.snakefile["kwargs"].get("commit", None)
        if not branch:
            raise ValueError(
                "Remote module requires a branch, tag or commit to be specified, "
                f"kwargs: {node.snakefile['kwargs']}"
            )
        # Copy github directory structure to the build directory
        blobs = Model.GetRemoteModule_BlobTree(node)
        for blob in blobs:
            url = (
                "https://raw.githubusercontent.com/"
                f"{m_repo_name}/{branch}/{blob['path']}"
            )
            response = requests.get(url)
            if response.status_code != 200:
                raise ValueError("Invalid response from github API: " + str(response))
            # Create directories
            blob_path = pathlib.Path(dest, blob["path"])
            pathlib.Path(os.path.dirname(blob_path)).mkdir(parents=True, exist_ok=True)
            # Write file
            with open(blob_path, "wb") as file:
                file.write(response.content)
        # Redirect snakefile location in config
        node.snakefile = str(
            pathlib.Path(
                "modules",
                m_repo_name,
                "workflows",
                m_project_foldername,
                m_type_foldername,
                m_modulename_foldername,
                m_workflow_foldername,
                "Snakefile",
            )
        )

    def PackageModules(self, build_path: str) -> None:
        # Copy modules to the workflow directory
        for node in self.nodes:
            if isinstance(node.snakefile, str):
                # Local file
                self.PackageModule_Local(build_path, node)
            else:
                # Remote file
                self.PackageModule_Remote(build_path, node)

    @staticmethod
    def GetRemoteModule_BlobTree(node: Node) -> List[dict]:
        """Returns the folder structure for a remote module"""
        if not isinstance(node.snakefile, dict):
            raise ValueError("Remote module configuration expected")
        owner, repo = node.snakefile["args"][0].split("/")
        module_folder = "/".join(node.snakefile["kwargs"]["path"].split("/")[:-2]) + "/"
        logging.debug(f"{owner=}, {repo=}, {module_folder=}")
        # branch identifier can actually be branch, tag or commit
        branch = node.snakefile["kwargs"].get("branch", None)
        if not branch:
            branch = node.snakefile["kwargs"].get("tag", None)
        if not branch:
            branch = node.snakefile["kwargs"].get("commit", None)
        if not branch:
            raise ValueError(
                "Remote module requires a branch, tag or commit to be specified, "
                f"kwargs: {node.snakefile['kwargs']}"
            )
        # Form github API query url - note that this queries the full repo tree
        tree = Model.GetRemoteModule_Tree(owner, repo, branch)
        return [d for d in tree if module_folder in d["path"] and d["type"] == "blob"]

    @staticmethod
    @cachetools.cached(cache=cachetools.TTLCache(maxsize=64, ttl=600))  # 10 mins cache
    def GetRemoteModule_Tree(owner, repo, branch) -> dict:
        """Returns the folder structure for a remote repo

        This method is time-to-live cached to avoid repeated calls to the github API
        for modules within the same repository.
        """
        url = (
            "https://api.github.com/repos/"
            f"{owner}/{repo}/git/trees/{branch}?recursive=1"
        )
        response = requests.get(url)
        if response.status_code != 200:
            raise ValueError("Invalid response from github API: " + str(response))
        response_json = response.json()
        return response_json["tree"]

    def SaveWorkflow(
        self,
        build_path: str = "build",
        clean_build: bool = True,
        package_modules: bool = False,
    ) -> str:
        """Saves the workflow to the build directory"""
        if clean_build:  # Delete build directory before rebuilding
            shutil.rmtree(build_path, ignore_errors=True)
        pathlib.Path(f"{build_path}/config").mkdir(parents=True, exist_ok=True)
        pathlib.Path(f"{build_path}/workflow").mkdir(parents=True, exist_ok=True)
        # Copy modules to the workflow directory and update config/snakefile
        if package_modules:
            self.PackageModules(build_path)
        # Write config and snakefile
        with open(f"{build_path}/workflow/Snakefile", "w") as file:
            file.write(self.BuildSnakefile())
        with open(f"{build_path}/config/config.yaml", "w") as file:
            file.write(self.BuildSnakefileConfig())
        # Include grapevne helper script
        shutil.copyfile(
            pathlib.Path(__file__).parent / "grapevne_helper.py",
            f"{build_path}/workflow/grapevne_helper.py",
        )
        # Include sendmail script (if workflow alerts are present)
        if self.alerts:
            shutil.copyfile(
                pathlib.Path(__file__).parent / "sendmail.py",
                f"{build_path}/workflow/sendmail.py",
            )
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
        return self.WrangleIfBuiltin(
            name.replace(" ", "_")
            .replace("/", "_")
            .replace(".", "_")
            .replace("(", "")
            .replace(")", "")
            .lower()
        )

    def WrangleIfBuiltin(self, name: str) -> str:
        """Prevent name from clashing with Python builtin functions

        Function name clashes can lead to obscure errors, so wrangle the rulename away
        from any such clashes.
        """
        if name in dir(builtins):
            return self.WrangleIfBuiltin(name + "_")
        else:
            return name

    def AddModule(self, name: str, module: dict) -> Module:
        """Adds a module to the workflow"""
        kwargs = module.copy()
        if "rulename" not in kwargs:
            kwargs["rulename"] = self.WrangleName(name)
        node = Module(name, kwargs)
        self.nodes.append(node)
        node.namespace = node.rulename
        return node

    def AddConnector(self, name, connector):
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
            for k, v in mapping[0].items():
                incoming_node = self.GetNodeByName(v)
                if not incoming_node:
                    if self.partial_build:
                        return
                    raise ValueError(
                        "No matching node found for connector source: " + v
                    )
                for p in node_to.ports:
                    if p["ref"] == k:
                        p["namespace"] = incoming_node.namespace
                        break
        else:
            node_from = self.GetNodeByName(mapping[0])
            if not node_from:
                if self.partial_build:
                    return
                raise ValueError(
                    "No matching node found for connector destination: " + mapping[0]
                )
            node_to.ports = get_port_spec(node_from.namespace)

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
            port_refs = [p["namespace"] for p in n.ports]
            if node.rulename in port_refs:
                return False
        return True

    def ExposeOrphanInputs(self) -> Ports:
        """Find orphan inputs and return as a valid ports list for a composite module

        Should return a Ports list containing:
         {
           ref (str),
           label (str),
           namespace (str),
           mapping: [
             {
               module: (target_module; str),
               port: (port ref; str),
             }
           ]
         }

        Find all orphan input ports that need to be exposed by a new composite module.
        The function currently only returns one mapping element per port.

        Note: Old-form mapping used to return an 'input_namespace' dictionary mapping of:
          { 'target_module$port': 'incoming_namespace' }

        Return a new ports list
        """

        module_ports = []
        all_namespaces = self.GetRuleNames()
        for n in self.nodes:
            for p in n.ports:
                if p["namespace"] in all_namespaces:
                    continue  # port is connected
                # Port is orphaned - create a new port to represent this
                module_port = {
                    "ref": f"{n.rulename}${p['ref']}",
                    "label": f"{p['ref']} ({n.rulename})",
                    "namespace": p[
                        "namespace"
                    ],  # keep same value (though disconnected)
                    "mapping": [
                        {
                            "module": n.rulename,
                            "port": p["ref"],
                        }
                    ],
                }
                module_ports.append(module_port)
        return module_ports

    def ExposeOrphanInputsList(self) -> List[str]:
        """Find orphan inputs and return as a namespace list"""
        # return [p["namespace"] for p in self.ExposeOrphanInputs()]

        """Find orphan inputs and return as a valid input_namespace"""
        orphans: List[str] = []
        all_output_namespaces = self.GetRuleNames()
        for node in self.nodes:
            for port in node.ports:
                if port["namespace"] not in all_output_namespaces:
                    orphans.append(port["namespace"])
        return orphans

    def ExposeOrphanOutputs(self) -> List[str]:
        """Find orphan output and return as a valid namespace"""
        module_namespaces: List[str] = []
        all_input_namespaces = self.GetInputNamespaces()
        for node in self.nodes:
            if node.namespace not in all_input_namespaces:
                module_namespaces.append(node.rulename)
        return module_namespaces

    def ExpandAllModules(self) -> None:
        """Expand all modules recursively"""
        module_list: List[str] = []
        while (modules := self.GetModuleNames()) != module_list:
            module_list = modules
            for rulename in modules:
                self.ExpandModule(rulename)

    def DebugPrint(self, node):
        if isinstance(node, list):
            for n in node:
                self.DebugPrint(n)
            return

        print("Node: " + node.rulename)
        print("  Name: " + node.name)
        print("  Namespace: " + node.namespace)
        print("  Ports:")
        for p in node.ports:
            print(f"    {p['ref']} ({p['label']}): {p['namespace']}")
            if mapping := p.get("mapping", []):
                for m in mapping:
                    print("      Mappings:")
                    print(f"        {m['module']}:{m['port']}")

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
        orphan_outputs_prior = self.ExposeOrphanOutputs()

        # Add new nodes
        rulemapping = {}
        new_nodes: List[Node] = []
        for n in modules_list:
            new_node = self.AddModule(n, {"config": config[n].get("config", {}).copy()})
            # Retain namespace mapping
            if c := config[n]["config"].get("ports"):
                new_node.ports = c
            elif c := config[n]["config"].get("input_namespace"):
                new_node.ports = get_port_spec(c)
            new_node.namespace = config[n]["config"].get(
                "namespace", new_node.namespace
            )
            new_node.snakefile = config[n].get("snakefile", new_node.snakefile)
            # Record new node and rulename mapping, if different
            new_nodes.append(new_node)
            if n != new_node.rulename:
                rulemapping[n] = new_node.rulename

        # Ensure namespace consistency between new nodes after rename
        for n in new_nodes:
            # namespace
            if n.namespace in rulemapping.keys():
                n.namespace = rulemapping[n.namespace]
            # ports
            for p in n.ports:
                if p["namespace"] in rulemapping.keys():
                    p["namespace"] = rulemapping[p["namespace"]]

        # Find orphan inputs and outputs from new node network
        # Sort to prevent reording of nodes that affect rule name wrangling
        #  (important for testing)
        new_orphan_outputs = sorted(
            list(set(self.ExposeOrphanOutputs()) - set(orphan_outputs_prior))
        )
        assert len(new_orphan_outputs) <= 1, (
            "More than one new orphan output found: " + str(new_orphan_outputs)
        )

        # Preserve incoming connections to parent node
        for port in node.ports:
            mapping = port.get("mapping", [])
            if len(mapping) == 0:
                continue
            target_module = mapping[0]["module"]
            if target_module in rulemapping.keys():
                target_module = rulemapping[target_module]
            target_port = mapping[0]["port"]
            target_node = self.GetNodeByRuleName(target_module)
            if not target_node:
                raise ValueError("No matching node found for name: " + target_module)
            for p in target_node.ports:
                if p["ref"] == target_port:
                    p["namespace"] = port["namespace"]

        # Preserve outgoing connections from parent node
        if len(new_orphan_outputs) == 1:
            for n in self.nodes:
                for port in n.ports:
                    if port["namespace"] == node.namespace:
                        port["namespace"] = list(new_orphan_outputs)[0]

        # Remove expanded node from model
        self.nodes.remove(node)

        # Return new nodes
        return new_nodes

    def GetModuleNames(self) -> List[str]:
        return [n.rulename for n in self.nodes if isinstance(n, Module)]

    def GetInputNamespaces(self) -> List[str]:
        namespaces = [p["namespace"] for n in self.nodes for p in n.ports]
        return [name for name in namespaces if name]

    def GetRuleNames(self) -> List[str]:
        return [n.rulename for n in self.nodes]

    def LookupRuleName(self, name: str) -> Optional[str]:
        for n in self.nodes:
            if name == n.name:
                return n.rulename
        return None

    def LookupRuleNames(self, names: List[str]) -> List[Optional[str]]:
        """Lookup rule name given full name, can take a single string or list"""
        return [self.LookupRuleName(name) for name in names]


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
                c += f'["{key}"]=[]\n'  # Create empty list
                for item in value:
                    if isinstance(item, dict):
                        c += f'["{key}"].append({item})\n'
                    else:
                        c += f'["{key}"].append("{item}")\n'
                # raise Exception("Lists not supported in config")
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
) -> Tuple[Union[Tuple[str, str], bytes], Model, str]:
    """Builds a workflow from a JSON specification file"""
    try:
        with open(filename, "r") as file:
            config = json.load(file)
    except FileNotFoundError:
        logging.error(f"Configuration file not found: {filename}")
        exit(1)
    except json.decoder.JSONDecodeError:
        logging.error(f"Invalid JSON file: {filename}")
        exit(1)
    return BuildFromJSON(config, **kwargs)


def CleanBuildFolder(build_path: str = "") -> None:
    """Deletes the build folder, if it exists"""
    if build_path:
        shutil.rmtree(build_path, ignore_errors=True)


def BuildFromJSON(
    config: dict,
    singlefile: bool = False,
    expand: bool = True,
    build_path: str = "build",
    clean_build: bool = True,
    partial_build: bool = False,  # Don't throw an error if node is missing
    create_zip: bool = True,
    package_modules: bool = False,
    workflow_alerts: dict = {},
) -> Tuple[Union[Tuple[str, str], bytes], Model, str]:
    """Builds a workflow from a JSON specification

    Returns a tuple of the workflow and the workflow model object.
    With singlefile=True the workflow is a tuple of (config, snakefile) strings
    With singlefile=False the workflow is a (zipped) directory structure.
    """
    logging.debug("BuildFromJSON")
    logging.debug(
        f"{config=}, {singlefile=}, {expand=}, {build_path=}, "
        f"{clean_build=}, {partial_build=}, {create_zip=}, {package_modules=}"
    )
    package_modules &= create_zip  # Package modules requires a zip file
    m = Model()
    m.SetPartialBuild(partial_build)
    # Add modules first to ensure all namespaces are defined before connectors
    for item in config:
        if item["type"].casefold() in ["module", "source", "terminal"]:
            logging.debug("=== Add module (call)")
            logging.debug(item)
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
    # Identify workflow alerts
    if workflow_alerts:
        m.alerts = ProcessWorkflowAlerts(workflow_alerts)
    if expand:
        logging.debug("Expanding modules...")
        m.ExpandAllModules()
    if singlefile:
        # Return composite string
        logging.debug("Returning single file build...")
        logging.debug(f"{m.BuildSnakefileConfig()}, {m.BuildSnakefile()}")
        return (
            (
                (
                    m.BuildSnakefileConfig(),
                    m.BuildSnakefile(),
                )
            ),
            m,
            "",
        )
    else:
        # Create (zipped) workflow and return as binary object
        build_path = m.SaveWorkflow(build_path, clean_build, package_modules)
        zipfilename = tempfile.gettempdir() + "/build"
        if create_zip:
            logging.debug("Creating zip file...")
            shutil.make_archive(zipfilename, "zip", build_path)
            with open(f"{zipfilename}.zip", "rb") as file:
                contents = file.read()
            logging.debug(f"Returning zip file: {zipfilename}.zip")
            return contents, m, zipfilename + ".zip"
        else:
            logging.debug("Returning build folder...")
            return b"", m, zipfilename + ".zip"


if __name__ == "__main__":
    # Builds a workflow given a JSON specification file
    parser = argparse.ArgumentParser()
    parser.add_argument("filename", help="Filename of json configuration")
    args = parser.parse_args()
    BuildFromFile(args.filename)
