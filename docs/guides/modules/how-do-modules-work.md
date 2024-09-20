# How do Modules work?

This page provides a description of the basic block of GRAPEVNE - the Module
specification. GRAPEVNE works by connecting 'Modules' together. These modules
are standard Snakemake workflows that conform to some additional constraints.

- Modules are self-contained Snakemake workflows, complete with all of the files
  required to run those workflows, such as configuration files, scripts, etc.
- Modules are organised in a standard directory structure, consistent with
  [Snakemake best-practises](https://snakemake.readthedocs.io/en/stable/snakefiles/deployment.html)
  and [WorkflowHub](https://workflowhub.eu/) requirements.
- Modules can be launched directly through Snakemake, independent of GRAPEVNE.

Beyond this, modules conform to certain standards and contain meta-data
that allow them to be easily reused, interfaced with one another, and connected together in a
hierarchical arrangement to form interconnected networks of varying scale
and sophistication. This capacity for reuse, flexibility, and an emphasis on
version control facilitates faster development, reproducibility and re-use of
existing processes.

## How do modules work?

Modules are built in Snakemake using our supplied supporting `grapevne` [framework](https://github.com/kraemer-lab/grapevne-py). This allows modules to be dynamically interfaced with one another to form hierarchical workflows.

## Are my existing Snakemake workflows useable as GRAPEVNE Modules?

Mostly. In order to allow dynamic connectivity, modules require input and output locations to conform to certain expectations. You achieve this by using our `grapevne` wrappers to redirect inputs and outputs. This is what permits dynamic interconnectivity when building workflows out of many inter-connected modules.

## How do I construct a module?

A Module is a Snakemake workflow that uses our `grapevne` [wrapper framework](https://github.com/kraemer-lab/grapevne-py) to redirect file paths. GRAPEVNE modules also conform to [Snakemake's best-practise workflow layout](https://snakemake.readthedocs.io/en/stable/snakefiles/deployment.html).

## A basic example

If you had a Snakefile consisting of one rule to copy a file from one location
to another (an admittedly reductionist example, but a useful one nonetheless):

```python
rule copy_file:
    input:
        "input_file.txt",
    output:
        "output_file.txt",
    shell:
        "cp {input[0]} {output[0]}"
```

then we can make this Snakefile compatible with GRAPEVNE Modules by making
two changes:

1. Add a configuration file that GRAPEVNE will use to provide namespace information, and
2. Reference the input and output namespaces within your rules.

To facilitate this each module should come bundled with a `grapevne_helper.py` function that installs the necessary `grapevne` wrapper functions. This function should be called at the beginning of the Snakefile.

```python
configfile: "config/config.yaml"
from grapevne_helper import import_grapevne

gv = import_grapevne(workflow)

rule copy_file:
    input:
        gv.input("input_file.txt"),
    output:
        gv.output("output_file.txt"),
    shell:
        "cp {input[0]} {output[0]}"
```

The config file can contains user parameters and other GRAPEVNE meta-data that allows it to interconnect the modules. All user parametrs should be specified in the `params` structure. There will also always be `input_namespace` and `output_namespace` fields that specify the input and output namespaces of the module (these are reconfigured by GRAPEVNE and correspond to the input port(s) and output port of the modules in the graphical editor).

A basic `config.yaml` file would look like this:

```yaml
input_namespace: "in"
output_namespace: "out"
params:
  Filename: "some_file.txt"
```

The actual values of the namespaces ("in" and "out") will be overwritten when
the modules form part of a larger workflow, but it is good practise to give them
easily discernable names in order to test your modules.

Note that an `input_namespace` of `null` has the special meaning that the module
take _no inputs_ (the module might provide database or file access, for instance).
This is not the same as a blank namespace (`""`), which simply indicates that
the namespace has no default value.

Input namespaces (_but not output namespaces_) can support multiple entries, allowing multiple connections to the module (input ports in the graphical editor). Within the config file this would be specified as a namespace dictonary, where the keys (e.g. "input_1") provide a user-friendly name to indicate the port, while the value (e.g. "input_1") acts like a normal namespace and is overwritten during the workflow build process. For example:

```yaml
input_namespace:
  - port1: "input_1"
  - port2: "input_2"
```

Since the `input_namespace` is now a list, these entries need to be accessed using the `grapevne` wrappers with a port specifier. For example, `input("filename", "port1")`.

Output namespaces consist of exactly one value, although you are free to organise
the contents within that namespace/folder in any way you see fit. As such you
could organise your data into subfolders. If you wanted to pass one such folder
to another node in your pipeline, this can be accomplished by making use of
one of the many Utility modules that are designed to support workflow
construction. In this case, a 'selection' module would allow you to 'select'
one sub-folder and pass that as the input to another node. This process can be
repeated to separate parallel analysis streams in a manual or automatic fashion.

To see the `grapevne` wrapper functions in action, along with extended explanations of their use, see the [Exploring the tutorial modules](tutorial-modules.md) page.

To see the full list of `grapevne` wrappers available, refer to the [grapevne-py documentation](https://github.com/kraemer-lab/grapevne-py).
