from typing import List

import yaml

from builder.builder import Model
from builder.builder_web import GetWorkflowFiles


def ImportWorkflowDir(
    workflow_dir: str,
    levels: int = -1,
) -> Model:
    """Import linked modules snakemake workflow as Model object

    Args:
        filename: Path to the workflow file
        levels: Number of levels to import (default -1 for all)
    """

    # TODO: Function shoud fully represent workflow as a graph (reconstructible)
    #  -  Read workflow and config files from github, etc.
    #  -  Need to derive URL specification from workflow file
    #  -  Implement levels and flattening
    #  -  Search workflow locations; support for .smk files?
    #  -  Read configfile to determine conf file path
    #  ?  Retain complete module blocks (not supported by our builder)
    #  ?  Retain non-module content (not supported by our builder)
    # (x) Support nested config files (not actually supported by YAML)

    workflow_str, config_str = GetWorkflowFiles(f"'{workflow_dir}'")
    config = yaml.safe_load(config_str)
    modules = ParseConfigDict(config)

    # TODO: Parse/tokenize workflow file, isolating 'module' blocks
    #  - Possible approach: isolate 'snakemake' directive, then execute
    #    the code as python with a dummy function to capture the function
    #    call, args and kwargs; write to url specification
    #  fcn.__name__

    wf_params = ExtractWorkflowParams(workflow_str)
    # TODO: Remove this; mock params return for now
    for name in modules:
        wf_params[name] = {}

    # Build model
    m = Model()
    for name in modules:
        # Namespaces are not ordinary parameters
        c = config[name].copy()
        c.pop("input_namespace", None)
        c.pop("output_namespace", None)
        node = m.AddModule(name, {"params": c})
        # Retain namespace mapping
        node.input_namespace = config[name].get("input_namespace", node.input_namespace)
        node.output_namespace = config[name].get(
            "output_namespace", node.output_namespace
        )
        node.url = wf_params[name].get("url", node.url)

    # Expand modules as required to the specified level
    level = 0
    if level < levels:
        modules = m.GetModuleNames()
        for name in modules:
            m.ExpandModule(name)
        level += 1

    return m


def ParseConfigDict(config: dict) -> List[str]:
    modules = []
    for k, v in config.items():
        if isinstance(v, dict):
            if "input_namespace" in v.keys() or "output_namespace" in v.keys():
                modules.append(k)
    return modules


def ExtractWorkflowParams(content: str) -> dict:
    # TODO: Return dict indexed by [name][param, eg. "url"]
    return {}


def ParseFunctionSignature(signature: str):
    def f(*args, **kwargs):
        return args, kwargs

    name, args = signature.split("(", 1)
    return name, *eval("f(" + args)
