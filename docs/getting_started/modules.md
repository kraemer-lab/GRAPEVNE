# Modules

PhyloFlow works by connecting 'Modules' together. These modules are standard
Snakemake workflows that conform to some additional requirements.

- Modules are self-contained Snakemake workflows, complete with all of the files
  required to run those workflows, such as configuration files, scripts, etc.
- Modules are organised in a standard directory structure, consistent with
  [Snakemake best-practises](https://snakemake.readthedocs.io/en/stable/snakefiles/deployment.html)
  and [WorkflowHub](https://workflowhub.eu/) requirements.
- Modules can be launched directly through Snakemake, independent of PhyloFlow.

Modules also conforms to certain standards, and can contain meta-data, that allow them to be
easily reused, interfaced with one another, and connected together in a
hierarchical arrangement to form interconnected module networks of varying scale
and sophistication. This capacity for reuse, flexibility, and an emphasis on
version control facilitates faster development and reliable re-use of
existing processes.

## How do modules work?

Modules specify `namespaces` (which can be thought of as folders) that allow
them to be dynamically interfaced with one another. They can also contain
meta-data that extends their functionality.

## Are my existing Snakemake workflows useable as PhyloFlow Modules?

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

A Module is Snakemake workflow that conforms to
[Snakemake's best-practise workflow layout](https://snakemake.readthedocs.io/en/stable/snakefiles/deployment.html).

In addition, the following parameters are configured and provided by PhyloFlow,
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
        "from_folder/input_file.txt"
    output:
        "to_folder/output_file.txt"
    shell:
        "cp {input} {output}"
```

then we can make this Snakefile compatible with PhyloFlow Modules by making
two changes:

1. Add a configuration file that PhyloFlow will use to provide the namespace
   information, and
2. reference the input and output namespaces within your rules.

```python
configfile: "config/config.yaml"

rule copy_file:
    input:
        expand(
            "{from_folder}/input_file.txt",
            from_folder=config["input_namespace"]
        )
    output:
        expand(
            "{to_folder}/output_file.txt",
            to_folder=config["output_namespace"]
        )
    shell:
        "cp {input} {output}
```

The config file can contain other parameters that you may wish to view
and modify within the PhyloFlow builder, but a basic file would simply provide
default values for the namespaces (these are actually overwritten by PhyloFlow,
but defaults ensure that the namespaces do not clash when you are developing /
testing your Modules in Snakemake [e.g. `snakemake --lint`]).

A basic `config.yaml` file would look like this:

```yaml
input_namespace: "a_folder_to_read_from"
output_namespace: "a_folder_to_write_to"
```

Input namespaces (_but not output namespaces_) can also support multiple entries,
for example when providing multiple inputs to a Module. Within the config file
this would be indicated by a namespace reference, and an associated default value,
for example:

```yaml
input_namespace:
  - example_input_1: "example_default_location_1"
  - example_input_2: "example_default_location_2"
```

Since the `input_namespace` is now a list, these entries can be accessed in the
Snakefile as (for example) `config["input_namespace"]["example_input_1"]`.
