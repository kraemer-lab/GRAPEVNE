"""Support routines for GRAPEVNE: Graphical Analytical Pipeline Development Environment

GRAPEVNE is an interactive environment for building and validating data processing
workflows.

See https://grapevne.readthedocs.io for further information.
"""


def remap_params(config: dict) -> dict:
    """Remap parameters by connecting parameter_maps between modules

    We will run this function recursively, so only need to concern ourselves with
    top-level modules and connections.

    Args:
        config: The config dict

    Returns:
        The config dict with remapped parameters
    """

    # Find top-level modules
    modules = []
    for name, d in config.items():
        if isinstance(d, dict) and d.get("config", None) is not None:
            modules.append(name)

    # Find parameter_maps
    for name in modules:
        d = config[name]
        if d.get("parameter_map", None) is not None:
            for mapitem in d["parameter_map"]:
                # Get the source and destination indexlists
                value = get_item(mapitem["from"], config)
                set_item(mapitem["to"], config, value)
    return config


def get_item(indexlist, config: dict):
    """Get an item from an indexlist

    Args:
        indexlist: A list of strings, each string is an index into a dict
        config: The dict to index into
    """
    item = config
    for it in indexlist:
        item = item[it]
    return item


def set_item(indexlist, config: dict, value):
    """Set an item from an indexlist

    Args:
        indexlist: A list of strings, each string is an index into a dict
        config: The dict to index into
    """
    item = config
    for it in indexlist[:-1]:
        item = item[it]
    item[indexlist[-1]] = value
