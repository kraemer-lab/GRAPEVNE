# Module 1: Providing the seeds

This analysis requires us to provide a list of seeds to analyse. We can find this
list in the file
[`ex_input/seeds.txt`](https://raw.githubusercontent.com/joetsui1994/vocpl/master/ex_input/seeds.txt)
of the [vocpl](https://github.com/joetsui1994/vocpl) repository.
This file contains the following two entries:

```
123456
2343231
```

As a starting point for our analysis, we want to create a 'source' module that
provides this file. Note that we could just provide the filename to our modules
directly, but we want the flexibility to easily change this filename in the
future, or to download any other arbitrary reference file
from the web. Formulating the input as a module allows us to replace the module
in its entirety in the future, affording us that freedom. For now, and as a good
example to demonstrate with, we will accomplish this in a simplistic fashion by copying
the file from its location into our pipeline.

We will start by writing a vanilla Snakemake rule to copy the `seeds.txt` file
from its source folder to a destination folder. After this, we will modify the
rule to make it compliant as a GRAPEVNE module.

To perform a simple copy operation in Snakemake we need to write a rule that
provides (as a minimum):

1. the name(s) of the source files,
2. the name(s) of the destination files, and
3. the instruction/command to execute (along with any parameters)

## Vanilla Snakemake version

Let us begin by first creating a repository of modules to store our analysis in.
Create a folder `GRAPEVNE-tutorial` (or any other name) and the following
directory structure for our workflow (`vocpl`), and first module (`provide_seeds`)
populating it with two files: the
[`seeds.txt`](https://raw.githubusercontent.com/joetsui1994/vocpl/master/ex_input/seeds.txt)
file from the repository (place it in the folder `resources`) and a new empty
file called `Snakemake` (place it in the folder `workflow`). Your directory
structure should look like this:

```
GRAPEVNE-tutorial
└── workflows
    └── vocpl
        └── sources
            └── provide_seeds
                ├── resources
                │   └── seeds.txt
                └── workflow
                    └── Snakefile
```

This origanization will help us to keep our modules organised as we go.

Open the `Snakemake` file and enter the following text:

```python
rule provide_seeds:
    input:
        "resources/seeds.txt"
    output:
        "results/out/seeds.txt"
    shell:
        "cp {input} {output}"
```

From the `terminal` (or [`PowerShell`](https://learn.microsoft.com/en-us/powershell/)
in Windows), ensure that you are in the `vocpl` folder, then dry-run the Snakemake
workflow by typing:

```
snakemake -np
```

You should see the output of the dry-run, starting with:

```
Building DAG of jobs...
Job stats:
job      count    min threads    max threads
-----  -------  -------------  -------------
copy         1              1              1
total        1              1              1
```

and ending with

```
This was a dry-run (flag -n). The order of jobs does not reflect the order of execution.
```

If there are any error messages, address these
now (ensure that `snakemake` is installed and up-to-date, and that you have no
typos in your files, filenames or folder names).

Once you are satisfied that all is well, you can execute your pipeline
(specifying the number of computer cores that Snakemake may use):

```
snakemake --cores 1
```

Your output should be similar to before, but this time the folders `results/out`,
and the file `results/out/seeds.txt`
will have been created. Your folder structure should now look like the following -
check this now (_tip_: the `tree` command is very useful for viewing folder
hierarchies if you have it installed).

```
provide_seeds
├── resources
│   └── seeds.txt
├── results
│   └── out
│       └── seeds.txt
└── workflow
    └── Snakefile
```

## Make `provide_seeds` GRAPEVNE-compliant

To make `provide_seeds` compliant with GRAPEVNE, we simply have to constrain
the input and output folders that are referenced in the rule so that GRAPEVNE
can redirect them later. That's it.

GRAPEVNE makes use of input and output `namespaces`, which can be thought of
as regular folders. Since our rule has no inputs (it is a 'source' module
since we always want to read from `resources/seeds.txt`)
we really only need to worry about where the file is being copied to. GRAPEVNE
alters the input and output namespaces through a Snakefile's config file, so
let's first create that, then populate it. Create a folder names `config` in
`provide_seeds`, then create a blank file called `config.yaml` inside that
folder, i.e.:

```
provide_seeds
├── config
│   └── config.yaml
:
```

Inside `config.yaml` enter the following:

```yaml
input_namespace: null
output_namespace: "out"
```

Setting `input_namespace` to `null` is a special convention used by GRAPEVNE
to indicate that there are no inputs to the module. The actual name used for
the `output_namespace` (`"out"` in this case) is immaterial as it will be
overwritten during any build process, but `"out"` provides a stable convention
that allows for simpler debugging.

Now, modify your Snakefile to load this configuration, and use the `output_namespace`
to redirect the rules' `output` directive, i.e.:

```python
configfile: "config/config.yaml"

rule provide_seeds:
    input:
        "resources/seeds.txt"
    output:
        expand(
            "results/{outdir}/seeds.txt",
            outdir = config["output_namespace"]
        )
    shell:
        "cp {input} {output}"
```

Here, we have made use of the `expand` function to insert our `output_namespace`
parameter value in-place of the output folder.

Now re-run Snakemake (_note_: before you do, delete the `results` folder from
any previous run). Use `snakemake -np` for a dry-run, and `snakemake --cores 1`
to generate results files. You should find that `results/out/seeds.txt` has been
created exactly as before.

**Your Snakemake workflow runs exactly the same as before, but now you have
exposed the [input and] output namespaces, permitting them to be changed in the
GRAPEVNE editor**

## A note on distributing files with modules

As a last step before we load our new module into the GRAPEVNE Builder, note
that our rule reads the seeds file from `"resources/seeds.txt"`. This will cause
Snakemake to look in the `resources` folder _of whichever folder you launch
snakemake from_. You might want this behaviour, if you are providing the files
locally but, in this tutorial, we are providing a seeds file to analyze, so we
always want to return the file that we provided with the rule.
To specify that the desired
path is _relative to the module_, we need to replace the line with:
`srcdir("../resources/seeds.txt")`, where `srcdir` provides the file path to
the Snakefile `workflow/Snakefile` (Note that we do not need to do this for the
input and output file paths because _we do want_ these to be generated locally
when we run our pipelines, as you shall see in the next step).

Our final `Snakefile` therefore looks like this:

```python
configfile: "config/config.yaml"

rule provide_seeds:
    input:
        srcdir("../resources/seeds.txt")
    output:
        expand(
            "results/{outdir}/seeds.txt",
            outdir = config["output_namespace"]
        )
    shell:
        "cp {input} {output}"
```

## Reflecting on this step

In-case you were wondering about the folder layout, throughout this
process we have followed the Snakemake guidelines for
[Distribution and Reproducibility](https://snakemake.readthedocs.io/en/stable/snakefiles/deployment.html)
in our folder structure. These are recommended reading before building any
modules for GRAPEVNE.

This simple example has provided a lot of insight. We now have a general
understanding of Snakemake rules, how their folders are structured for
distribution and reproducilibity, how to add a configuration file (that
GRAPEVNE will use to build workflow graphs), and why it is important to
provide the full path to files when distributing data.

## Visualising the module in GRAPEVNE Builder

Before we move on to the next step (building the Subsample alignment module),
let's visualise our `provide_seeds` module in the GRAPEVNE Builder. Launch
`GRAPEVNE`, ensure `Local filesystem` is selected from the repository drop-down
box, enter your repository location ("_...path to GRAPEVNE-tutorial..._") and click
`GET MODULES LIST`. You should see `provide_seeds` appear in the list on the
left of the screen. Drag it into the main area and click on it to see all
available properties. The module is fairly minimal as it contains only the
input and output namespace definitions, but we shall see how to create modules
with parameters, inputs, and how to begin chaining modules in the next step...
