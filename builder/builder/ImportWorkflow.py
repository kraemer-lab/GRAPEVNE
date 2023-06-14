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
    workflow_str, config_str = GetWorkflowFiles(f"'{workflow_dir}'")
    workflow_config = yaml.safe_load(config_str)
    modules = ParseConfigDict(config=workflow_config)

    # Build model
    m = Model()
    for name in modules:
        # Namespaces are not ordinary parameters
        config = workflow_config[name]["config"]
        c = config.copy()
        c.pop("input_namespace", None)
        c.pop("output_namespace", None)
        node = m.AddModule(name, {"params": c})
        # Retain namespace mapping
        node.input_namespace = config.get("input_namespace", node.input_namespace)
        node.output_namespace = config.get("output_namespace", node.output_namespace)
        node.snakefile = workflow_config[name].get("snakefile", node.snakefile)

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
        vc = v["config"]
        if isinstance(vc, dict):
            if "input_namespace" in vc.keys() or "output_namespace" in vc.keys():
                modules.append(k)
    return modules


def ParseFunctionSignature(signature: str):
    def f(*args, **kwargs):
        return args, kwargs

    name, args = signature.split("(", 1)
    return name, *eval("f(" + args)
