from os import listdir
from os.path import abspath
from os.path import isdir
from os.path import join
from typing import List
from typing import Tuple

import requests
import yaml


def GetModulesList(url: dict) -> List[dict]:
    """Get modules list from url"""
    if url["type"] == "github":
        return GetRemoteModulesGithub(url["repo"], url["listing_type"])
    elif url["type"] == "local":
        return GetLocalModules(url["repo"])
    else:
        raise Exception("Invalid url type.")


def GetLocalModules(path: str) -> List[dict]:
    """Get local modules from path"""
    path_base: str = f"{path}/workflows"

    # Get list of local filesystem directories in path
    orgs = sorted([f for f in listdir(path_base) if isdir(join(path_base, f))])
    modules = []

    # First-level (organisation) listing
    for org in orgs:
        org_path = f"{path_base}/{org}"
        module_types = reversed(
            sorted([f for f in listdir(org_path) if isdir(join(org_path, f))])
        )

        # Second-level (module type) listing
        for module_type in module_types:
            module_type_path = f"{org_path}/{module_type}"
            workflows = sorted(
                [
                    f
                    for f in listdir(module_type_path)
                    if isdir(join(module_type_path, f))
                ]
            )

            # Third-level (module/workflow) listing
            for workflow in workflows:
                url_workflow = (
                    f"{path_base}/{org}/{module_type}/{workflow}/workflow/Snakefile"
                )
                config_file = (
                    f"{path_base}/{org}/{module_type}/{workflow}/config/config.yaml"
                )
                config = {}
                try:
                    with open(config_file, "r") as file:
                        config = yaml.safe_load(file)
                except FileNotFoundError:
                    print(f"Config file not found - assuming blank: {file}")
                modules.append(
                    {
                        "name": f"({org}) {FormatName(workflow)}",
                        "type": module_type[:-1],  # remove plural
                        "config": {
                            "snakefile": abspath(url_workflow),
                            "config": config,
                        },
                    }
                )
    return modules


def GetRemoteModulesGithub(
    repo: str, listing_type: str = "BranchListing"
) -> List[dict]:
    """Get remote modules from url

    Function currently supports workflows by directory listing, but could also
    support listings by branches in the future.

    Args:
        repo: repository string in the format: "owner/repository"
        listing_type: type of listing to use (default: "BranchListing").
                      Options: "BranchListing", "DirectoryListing"

    Returns:
        List of modules
    """

    if listing_type == "DirectoryListing":
        return GetRemoteModulesGithubDirectoryListing(repo)
    elif listing_type == "BranchListing":
        return GetRemoteModulesGithubBranchListing(repo)
    else:
        raise Exception("Invalid Github listing type.")


def GetRemoteModulesGithubDirectoryListing(repo: str) -> List[dict]:
    """Get remote modules from url (by directory listing)

    Args:
        repo: repository string in the format: "owner/repository"

    Returns:
        List of modules
    """

    url_github: str = "https://api.github.com/repos"
    url_base: str = f"{url_github}/{repo}/contents/workflows"
    r_base = requests.get(url_base)
    if r_base.status_code != 200:
        raise Exception("Github API request failed (getting organisation listing).")
    modules = []
    branch = "main"

    # First-level (organisation) listing
    for org in r_base.json():
        if org["type"] != "dir":
            continue
        url_org = f"{url_base}/{org['name']}"
        print(url_org)
        r_org = requests.get(url_org)
        if r_org.status_code != 200:
            raise Exception("Github API request failed (getting module type listing).")

        # Second-level (module type) listing
        for module_type in reversed(r_org.json()):
            if module_type["type"] != "dir":
                continue
            url_workflow = f"{url_org}/{module_type['name']}"
            r_workflow = requests.get(url_workflow)
            if r_workflow.status_code != 200:
                raise Exception(
                    "Github API request failed (getting module/workflow listing)."
                )

            # Third-level (module/workflow) listing
            for workflow in r_workflow.json():
                if workflow["type"] != "dir":
                    continue
                url_workflow = (
                    f"{repo}/workflows/"
                    f"{org['name']}/"
                    f"{module_type['name']}/"
                    f"{workflow['name']}/workflow/Snakefile"
                )
                url_config = (
                    f"https://raw.githubusercontent.com/{repo}/"
                    f"{branch}/workflows/"
                    f"{org['name']}/"
                    f"{module_type['name']}/"
                    f"{workflow['name']}/config/config.yaml"
                )
                r_config = requests.get(url_config)
                if r_config.status_code != 200:
                    raise Exception(
                        "Github API request failed (getting workflow config file)."
                    )
                config = yaml.safe_load(r_config.text)
                modules.append(
                    {
                        "name": f"({org['name']}) {FormatName(workflow['name'])}",
                        "type": module_type["name"][:-1],  # remove plural
                        "config": {
                            "snakefile": {
                                "function": "github",
                                "args": [repo],
                                "kwargs": {
                                    "path": f"workflows/{org['name']}/"
                                    f"{module_type['name']}/"
                                    f"{workflow['name']}/"
                                    "workflow/Snakefile",
                                    "branch": branch,
                                },
                            },
                            "config": config,
                        },
                    }
                )

    return modules


def GetRemoteModulesGithubBranchListing(repo: str) -> List[dict]:
    """Get remote modules from url (by branches)

    Args:
        repo: repository string in the format: "owner/repository"

    Returns:
        List of modules
    """

    url_github: str = "https://api.github.com/repos"
    url_base: str = f"{url_github}/{repo}/branches"
    r_base = requests.get(url_base)
    if r_base.status_code != 200:
        raise Exception("Github API request failed (getting GitHub branches).")
    modules = []

    # Branch listing
    module_types = {"m": "module", "c": "connector", "s": "source", "t": "terminal"}
    for branch in r_base.json():
        if branch["name"] == "main":
            continue
        [module_type, module_org_and_name] = branch["name"].split("/", 1)
        [module_org, module_name] = module_org_and_name.split("/", 1)
        if module_type not in module_types:
            raise Exception(
                f"Invalid module type '{module_type}' in branch '{branch['name']}'."
            )

        url_config = (
            f"https://raw.githubusercontent.com/{repo}/"
            f"{branch['name']}/config/config.yaml"
        )
        r_config = requests.get(url_config)
        if r_config.status_code != 200:
            raise Exception("Github API request failed (getting workflow config file).")
        config = yaml.safe_load(r_config.text)
        modules.append(
            {
                "name": branch["name"],
                "type": module_types[module_type],
                "config": {
                    "snakefile": {
                        "function": "github",
                        "args": [repo],
                        "kwargs": {
                            "path": "/workflow/Snakefile",
                            "branch": branch["name"],
                        },
                    },
                    "config": config,
                },
            }
        )

    return modules


def GetWorkflowFiles(
    load_command: str,
) -> Tuple[str, str]:
    """Read workflow and config files

    Args:
        load_command: command used to load the module in the Snakemake file
    """
    # Determine if workflow is local or remote
    if load_command[0] in ["'", '"']:
        return GetWorkflowFilesLocal(load_command)
    else:
        return GetWorkflowFilesRemote(load_command)


def GetWorkflowFilesLocal(
    load_command: str,
) -> Tuple[str, str]:
    """Read workflow and config files from local directory

    Args:
        load_command: command used to load the module in the Snakemake file
    """
    # Isolate string containing workflow directory
    workflow_dir = eval(load_command)
    if isinstance(workflow_dir, tuple):  # account for trailing comma
        workflow_dir = workflow_dir[0]
    workflow_file = abspath(join(workflow_dir, "workflow/Snakefile"))
    with open(workflow_file, "r") as file:
        workflow_str = file.read()
    # Parse workflow for configfile directive

    # Import config file (if specified)
    configfile = "config/config.yaml"
    config_file = abspath(join(workflow_dir, configfile))
    with open(config_file, "r") as file:
        config_str = file.read()

    return workflow_str, config_str


def GetWorkflowFilesRemote(
    load_command: str,
) -> Tuple[str, str]:
    """Read workflow and config files from remote source

    Args:
        load_command: command used to load the module in the Snakemake file
    """
    raise Exception(
        "Only loading from local sources (load_command contains a string) "
        "is currently supported."
    )


def FormatName(name: str) -> str:
    """Formats name to (human readable) title case"""
    return " ".join([n[0].upper() + n[1:] for n in name.replace("_", " ").split(" ")])


if __name__ == "__main__":
    """Test function using default repository"""
    print(
        GetModulesList(
            {
                "type": "local",
                "listing_type": "DirectoryListing",
                "path": "../../snakeshack",
            }
        )
    )
