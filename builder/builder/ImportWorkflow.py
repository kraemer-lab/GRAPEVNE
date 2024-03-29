import re

import yaml

from builder.builder import Model
from builder.builder_web import GetWorkflowFiles


def ImportWorkflowDir(
    workflow_dir: str,
) -> Model:
    """Import linked modules snakemake workflow as Model object

    Args:
        filename: Path to the workflow file
        levels: Number of levels to import (default -1 for all)
    """
    workflow_str, config_str = GetWorkflowFiles(f"'{workflow_dir}'")
    workflow_config = yaml.safe_load(config_str)
    modules = re.findall("^module (.*):", workflow_str, re.MULTILINE)

    # Build model
    m = Model()
    for rulename in modules:
        # Namespaces are not ordinary parameters
        config = workflow_config[rulename]["config"]
        c = config.copy()
        c.pop("input_namespace", None)
        c.pop("output_namespace", None)
        node = m.AddModule(rulename, {"config": c})
        # Retain namespace mapping
        node.input_namespace = config.get("input_namespace", node.input_namespace)
        node.output_namespace = config.get("output_namespace", node.output_namespace)
        node.snakefile = workflow_config[rulename].get("snakefile", node.snakefile)

    # Expand modules
    m.ExpandAllModules()

    return m
