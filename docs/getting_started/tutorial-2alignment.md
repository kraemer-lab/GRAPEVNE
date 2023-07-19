# Module 2: Subsample alignment

This module will require two rules: one to
generate randomly subsampled data, and the other to align these data. We will
develop the first one as a module, and then combine it with a provided module
for alignment. These rules must apply to each seed specified in the `seeds.txt`
file from the previous step, and the analysis for which is expected to be
deposited in it's own folder.

Let's start with the configuration file. The NEXTFLOW pipeline defines some
parameters for this analysis. Here, we will simply copy those across, while
adding our `input_namespace` and `output_namespace` parameters.

The file `config/config.yaml` should therefore look like this:

```yaml
input_namespace: in
output_namespace: out
params:
  n_random: 50
  master_fasta: resources/beta.fasta
  master_metadata: resources/beta.metadata.tsv
```

The collation of workflow parameters under the `params` heading has no special
meaning and can be removed if desired, but can help to maintain structure and
readability, especially when workflows increase in complexity.

We also note that we require two auxiliary files to perform this analysis.
The first (`beta.fasta`) requires access to [GISAID](https://gisaid.org/)
to obtain, but the second (`beta.metadata.tsv`) is available through the
[`vocpl` github repository](https://github.com/joetsui1994/vocpl).
Create a `subsample_alignment/resources` folder and copy these files into that
folder now.

## Random subsampling

Let us examine the random subsampling rules. The raw rule would consist of three
lines, which read:

```bash
head -n1 resources/beta.metadata.tsv > results/out/subsample_metadata.tsv
shuf -n 50 resources/beta.metadata.tsv >> results/out/subsample_metadata.tsv
tail -n +2 results/out/subsample_metadata.tsv | cut -f1 > results/out/subsample_ids.tsv
```

We want to substitute dynamic names in place of fixed names, making use of
Snakemake's `input`, `output` and `params` directives. We would then obtain:

```bash
head -n1 {input.master_metadata} > {output.subsample_metadata}
shuf -n {params.n_random} {input.master_metadata} >> {output.subsample_metadata}
tail -n +2 {output.subsample_metadata} | cut -f1 > {output.subsample_ids}
```

Now, let's place this set of commands inside a Snakemake rule and provide
the necessary directives:

```python
rule random_subsample_ids_metadata:
    input:
        master_metadata = expand(
            srcdir("../{master_metadata}"),
            master_metadata=config["params"]["master_metadata"],
        ),
    output:
        subsample_ids = expand(
            "results/{outdir}/subsample_ids.tsv",
            outdir=config["output_namespace"],
        ),
        subsample_metadata = expand(
            "results/{outdir}/subsample_metadata.tsv",
            outdir=config["output_namespace"],
        ),
        ),
    params:
        n_random=config["params"]["n_random"],
    shell:
        """
        head -n1 {input.master_metadata} > {output.subsample_metadata}
        shuf -n {params.n_random} {input.master_metadata} >> {output.subsample_metadata}
        tail -n +2 {output.subsample_metadata} | cut -f1 > {output.subsample_ids}
        """
```

The `params.n_random` is the simplest to understand, since this reads directly
from the configuration file (`config["params"]["n_random"]`). We define both
`subsample_ids` and `subsample_metadata` as
[named outputs](https://snakemake.readthedocs.io/en/stable/snakefiles/rules.html)
for convenience, with each specifying the output filename `subsample_ids.tsv`
and `subsample_metadata.tsv` to be deposited in the folder `"results/{outdir}"`.
Note that `outdir` refers to `config["output_namespace"]` here, so this is the
destination folder as (will be) provided by GRAPEVNE.
The resource file `master_metadata` (again, named for convenience) is specified
with `srcdir` since we are providing the file with our analysis (see the previous
tutorial step if this is unclear). It is worth taking a moment to
ensure that you are comfortable with this rule before continuing.

We have now not only converted this 3 line instruction into a valid Snakemake
rule, but at the same time made it GRAPEVNE compliant simply by specifying
`input_namespace` and `output_namespace` in the configuration, and ensuring that
all relevant input and output folders reference them in the Snakefile. Instead
of building out the particulars of this rule further, let us combine
this module with some others that have already been built to produce our desired
`subsample_alignment` module.

You will note that, so far, neither module that we have written depend on the
input from any other modules. Instead, both depend only on pre-existing files
that are provided as resources with those rules. In the next step we will look
at input namespaces for situations where we receive input from one, or indeed
multiple different modules.
