from os import listdir
from os.path import abspath
from os.path import isdir
from os.path import join
from typing import List

import requests
import yaml


def GetModulesList(url: dict) -> List[dict]:
    """Get modules list from url"""
    match url["type"]:
        case "github":
            return GetRemoteModulesGithub(url["repo"], url["listing_type"])
        case "local":
            return GetLocalModules(url["repo"])
        case _:
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
                url_workflow = f"{path_base}/{org}/{module_type}/{workflow}"
                config_file = f"{url_workflow}/config/config.yaml"
                params = {}
                try:
                    with open(config_file, "r") as file:
                        params = yaml.safe_load(file)
                except FileNotFoundError:
                    print(f"Config file not found - assuming blank: {file}")
                modules.append(
                    {
                        "name": f"{org}_{workflow}",
                        "type": module_type[:-1],  # remove plural
                        "config": {
                            "url": abspath(url_workflow),
                            "params": params,
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

    Input
        repo:           repository string in the format: "owner/repository"
        listing_type:   "DirectoryListing" or "BranchListing"

    Output
        list of modules
    """

    match listing_type:
        case "DirectoryListing":
            return GetRemoteModulesGithubDirectoryListing(repo)
        case "BranchListing":
            return GetRemoteModulesGithubBranchListing(repo)
        case _:
            raise Exception("Invalid Github listing type.")


def GetRemoteModulesGithubDirectoryListing(repo: str) -> List[dict]:
    """Get remote modules from url (by directory listing)

    repo: repository string in the format: "owner/repository"
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
                    f"{workflow['name']}"
                )
                url_config = (
                    f"https://raw.githubusercontent.com/{repo}/"
                    f"{branch}/workflows/"
                    f"{org['name']}/"
                    f"{module_type['name']}/"
                    f"{workflow['name']}/config/config.yaml"
                )
                print(url_config)
                r_config = requests.get(url_config)
                if r_config.status_code != 200:
                    raise Exception(
                        "Github API request failed (getting workflow config file)."
                    )
                params = yaml.safe_load(r_config.text)
                modules.append(
                    {
                        "name": f"{org['name']}_{workflow['name']}",
                        "type": module_type["name"][:-1],  # remove plural
                        "config": {
                            "url": {
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
                            "params": params,
                        },
                    }
                )

    return modules


def GetRemoteModulesGithubBranchListing(repo: str) -> List[dict]:
    """Get remote modules from url (by branches)

    repo: repository string in the format: "owner/repository"
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
        params = yaml.safe_load(r_config.text)
        modules.append(
            {
                "name": branch["name"],
                "type": module_types[module_type],
                "config": {
                    "url": {
                        "function": "github",
                        "args": [repo],
                        "kwargs": {
                            "path": "/workflow/Snakefile",
                            "branch": branch["name"],
                        },
                    },
                    "params": params,
                },
            }
        )

    return modules


if __name__ == "__main__":
    # Test function using default repository
    print(
        GetModulesList(
            {
                "type": "local",
                "listing_type": "DirectoryListing",
                "path": "../../snakeshack",
            }
        )
    )
