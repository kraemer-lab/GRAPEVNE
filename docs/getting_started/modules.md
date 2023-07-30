# Inside modules

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

Modules specify `namespaces` (which can be thought of as folders) that allow
them to be dynamically interfaced with one another. They can also contain
meta-data that extends their functionality.

## Are my existing Snakemake workflows useable as GRAPEVNE Modules?

Mostly. In order to allow dynamic connectivity, modules require input and output
locations to conform to specific configuration keys (which you may subsequently
redefine within your workflows). This is what perrmits dynamic
interconnectivity when building workflows of connected Modules.

There are two approaches to importing existing workflows:

1. Encapsulation: where you 'wrap' your workflow in a Module. Here, you would
   redirect the workflows to use the provided namespaces as your input and output
   folders. This will not permit rapid reuse of sub-components, but does permit
   existing workflows to be parameterized and connected to other Modules very
   easily.
2. Modular construction: ideally, modules would consist of sub-modules as this
   affords maximum flexibility. This requires each stage of the pipeline to be a
   valid Module, which is prefered from a reuse and testability perspective, but
   will take longer to accomplish.

## How do I construct a module?

A Module is a Snakemake workflow that conforms to
[Snakemake's best-practise workflow layout](https://snakemake.readthedocs.io/en/stable/snakefiles/deployment.html).

In addition, the following parameters are configured and provided by GRAPEVNE,
and should be referenced in place of their existing values within the Snakefile.

- `input_namespace`
  The input namespace (aka 'folder') that contains the incoming data to the Module.
  Input namespaces are specified in the Snakemake `configfile` and can contain
  multiple entries, corresponding to different input namespaces (i.e. inputs from
  multiple external Modules).

- `output_namespace`

The output namespace (aka 'folder') where the output of the Module's workflow /
pipeline will be sent. Only a single output namespace is supported per Module.

## A basic example

If you had a Snakefile consisting of one rule to copy a file from one location
to another (an admittedly reductionist example, but a useful one nonetheless):

```python
rule copy_file:
    input:
        "in/input_file.txt"
    output:
        "out/output_file.txt"
    shell:
        "cp {input} {output}"
```

then we can make this Snakefile compatible with GRAPEVNE Modules by making
two changes:

1. Add a configuration file that GRAPEVNE will use to provide the namespace
   information, and
2. reference the input and output namespaces within your rules.

```python
configfile: "config/config.yaml"

rule copy_file:
    input:
        expand(
            "{indir}/input_file.txt",
            indir=config["input_namespace"]
        )
    output:
        expand(
            "{outdir}/output_file.txt",
            outdir=config["output_namespace"]
        )
    shell:
        "cp {input} {output}
```

The config file can contain other parameters that you may wish to view
and modify within the GRAPEVNE builder, but a basic file would simply provide
default values for the namespaces (these are actually overwritten by GRAPEVNE,
but defaults ensure that the namespaces do not clash when you are developing /
testing your Modules in Snakemake [e.g. `snakemake --lint`]).

A basic `config.yaml` file would look like this:

```yaml
input_namespace: "in"
output_namespace: "out"
```

The actual values ("in" and "out" of the namespaces) will be overwritten when
the modules form part of a large graph, but it is good practise to give them
easily discernable names in order to test your modules (providing unique names
for each is also important to prevent file name clashes).

Note that an `input_namespace` of `null` has the special meaning that the module
take _no inputs_ (the module might provide database or file access, for instance).
This is not the same as a blank namespace (`""`), which simply indicates that
the namespace has no default value.

Input namespaces (_but not output namespaces_) can support multiple entries,
allowing multiple connections to the module. Within the config file
this would be specified as a namespace dictonary, where the keys (e.g.
"input_1") provide a user-friendly name to indicate the type of input,
while the value (e.g. "input_1") acts like a normal namespace and is overwritten
during the workflow build process. For example:

```yaml
input_namespace:
  - example_input_1: "input_1"
  - example_input_2: "input_2"
```

Since the `input_namespace` is now a list, these entries can be accessed in the
Snakefile as (for example) `config["input_namespace"]["input_1"]`.

Output namespaces consist of exactly one value, although you are free to organise
the contents within that namespace/folder in any way you see fit. As such you
could organise your data into subfolders. If you wanted to pass one such folder
to another node in your pipeline, this can be accomplished by making use of
one of the many Utility modules that are designed to support workflow
construction. In this case, a 'selection' module would allow you to 'select'
one sub-folder and pass that as the input to another node. This process can be
repeated to separate parallel analysis streams in a manual or automatic fashion.

```{note}
Remember that Snakefiles are essentially Python documents, allowing you
to write python code, import modules, etc. A basic convenience would be to
create an alias at the beginning of the file (immediately after `configfile`)
defining, for example,
`in1=config["input_namespace"]["example_input_1"]`, then make use of that alias
(`in1`) instead of writing the full `config` location out each time. As you can
see, this becomes particularly useful when dealing with multiple input namespaces.
```
