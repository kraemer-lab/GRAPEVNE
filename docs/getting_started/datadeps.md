# Data dependent rules

In this section we will discuss file dependencies, and file-content
dependencies. Note that these are not Phyloflow-specific issues, and instead
reflect more general Snakemake considerations that we feel it is important to
be aware of when building modular workflows.

As stated previously, a valid Snakemake rule typically consists of an `input`
directive, an `output` directive, and a `shell` (or `run`) directive. Within the
Snakemake rule these directives tend to appear in this order. However,
this ordering can be deceptive as it implies that the presence of input
files _drives_ the generation of output files.
But, Snakemake is a _build system_ which works by determining
which inputs are require to build _a set of target ouputs_ (not the other way
around!).

To conceptualise this more clearly, considered the following file structure:

```
|- a.txt
|- b.txt
|- c.txt
```

If we wanted to copy the contents of these files to a set of similarly named
`.backup` files, then we could conceptually write the following Snakefile:

```python
rule echo:
    input:
        "{name}.txt"
    output:
        "{name}.txt.backup"
    shell:
        "echo {input} > {output}"
```

However, when attempting to execute this pipeline Snakemake will produce the
following error
`"WorkflowError: Target rules may not contain wildcards."`.
This is because Snakemake determines which rules to run based on a set of file
targets (as opposed to processing a series of instructions on some input data
[which is more analogous to NEXTFLOW channels]).

The simplest way to resolve this issue is to provide a default rule (the first
rule in a Snakefile is the default... by default). If we therefore add a
`target` rule at the top of our file:

```python
rule target:
    input:
        "a.txt.backup",
        "b.txt.backup",
        "c.txt.backup",
```

then we are stating our desired targets, and Snakemake is then able to make use of
the `echo` rule (with its wildcards) to derive a ruleset that can
produce `a.txt.backup`, given our rule (`echo`) and the fact that `a.txt` exists in the
current folder. However, without this `target` directive, Snakemake doesn't
know what it's target is, so it cannot derive a ruleset to create it.

There are some more elegant ways to write this, such as specifying the names in
a list (i.e. `expand("{name}.txt.backup", name=['a', 'b', 'c'])`), but they all
suffer from the same issue - they are not data-dependent, i.e. you must know
the names of the desired files _before you launch your pipeline_ and provide
them as your targets.

This would seem a serious impediment, especially if we are interested in building
modular workflows where depedencies cannot be known beforehand. However, in
practise simple workflows rely on consistent naming conventions and are
unaffected, and in-fact functionality does exist within Snakemake to overcome
this problem for more complex workflows, namely through the use of
[`checkpoint`s](https://snakemake.readthedocs.io/en/stable/snakefiles/rules.html#data-dependent-conditional-execution).
Briefly, checkpoints allow data-dependent execution rules to exist by
re-evaluating the rule-chain at the end of these rules. This allows targets to
be regenerated once rules complete. The use of checkpoints requires some
finese, but we will demonstrate their utility using our `seeds.txt` file.

## Checkpoints with `seeds.txt`

Given our `seeds.txt` file, we want to perform an analysis on each item in this
list. But this is a data-dependency - we do not know the contents of the file
before the workflow runs. To overcome this issue we introduce a `checkpoint`
into our workflow and produce target rules based on the output of those
checkpoints.

To demonstrate their utility, here is a truncated and annotated Snakefile for
a more all-encompassing `subsample_alignment` module.

```python
configfile: "config/config.yaml"
outdir = config["output_namespace"]

# The 'checkpoint' rule is executed once seeds.txt is available.
# We make a copy of the file in this case as only the output
# from the checkpoint is accessible later on...
checkpoint get_seeds:
    input:
        expand("results/{indir}/seeds.txt",
               indir=config["input_namespace"])
    output:
        expand("results/{outdir}/seeds.txt",
               outdir=outdir)
    shell:
        "cp {input} {output}"

# Standard Python function to read the contents of a file and
# return its contents as a list. This will be a list of seeds
# in our case. We could also have written this as a lambda
# function within a rule, but keeping it separate is clearer.
def read_seeds_file(wildcards):
    with open(checkpoints.get_seeds.get().output[0], "r") as file:
        return file.read().splitlines()

# This rule uses the seeds list from read_seeds_file()
# to create a (data-dependent) list of file dependencies
rule target:
    input:
        expand(
            "results/{outdir}/s{key}/subsample_aln.fasta",
            outdir=outdir,
            key=read_seeds_file,
        )
    default_target: True

# This rule tells Snakemake how to generate the new target files
# and could be specified with other input dependencies as required,
# leading to the formation of rule chains.
rule subsample_alignment:
    output:
        expand(
            "results/{outdir}/s{{key}}/subsample_aln.fasta",
            outdir=outdir,
        ),
    # `inputs`, `params` and `shell` directives removed for brevity.
    # Instead, we just echo the seed name into the output file as a demo
    shell:
        "echo {{key}} {output}"
```

The key here is that the Python function `read_seeds_file` depends on (and has
access to) the output(s) of the `checkpoint` rule. Execution will wait until this
succeeds, at which point `read_seeds_file` is run, which provides build targets
for the rule `target`. In our example, those build rules specify which seeds
(or 'key' wildcards as they are represented above) are generated. Without this
arrangement Snakemake would not know which seeds to analyse.
