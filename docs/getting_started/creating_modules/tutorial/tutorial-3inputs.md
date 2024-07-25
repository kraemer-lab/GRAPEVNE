# Inputs

You will notice from the previous steps that several of our modules had
multiple inputs. This is a feature of GRAPEVNE modules that allows processes to
have access to data from multiple different namespaces.

To understand how these are specified and can be used within modules, see
[inside modules](../quickstart/inside-modules.md).

## Optional inputs

Input that don't provide any data or analysis that is required for the pipeline
will not be executed, as is true for any rules in the workflow. However, we
can make these "optional" inputs explicit by only inluding rules when a specific
input is connected. The way that we accomplish this is to wrap the relevant
rules in an "if" statement that only runs when the input namespace is not equal
to its default value (and therefore has not been remapped by GRAPEVNE).

This is the approach adopted in most of the modules provided in the vocpl
pipeline. Although this adds some additional code to the module specifications,
it allows each module to operate in two modes, either:

1. depending on its successors for seed values, or
2. directly accepting an input list of seeds.

To see this in action, here is a truncated workflow from the module
`nextalign`:

```python
configfile: "config/config.yaml"

from pathlib import Path

outdir = config["output_namespace"]

if config["input_namespace"] != "seeds":
    checkpoint get_seeds:
        ...

    def read_seeds_file(wildcards):
        ...

    rule target:
        ...

rule nextalign:
    ...
```

In this case the rule `nextalign` (within the module `nextalign`) is retained
in both instances (when the `seeds` input namespace is connected and when it
is not); however, the checkpoint, function and rule within the `if` statement
are only included in the workflow when the `seeds` input is connected to another
module.
