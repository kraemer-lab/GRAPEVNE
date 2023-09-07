# The complete pipeline

Let us build the complete pipeline, then alter it to demonstrate versatility.

```{note}
This pipeline uses workflow elements that were built with linux/macOS in mind,
and as such may not run on Windows at this time.
```

## Construct the workflow

Open GRAPEVNE (or clear the graph view).

Select `(vocpl)` from the repository filter. Here you will find modules
corresponding to the different stages of our pipeline. Following the workflow
presented on the previous page, drag the following items into the graph-view
and connect them together, taking care to connect them in the correct order
using the `In` or `fasta` inputs (do not connect the `seeds` inputs). Use
the `fasttree` module for maximum likelihood estimation.

Your workflow should now contain the following nodes:

- subsample_alignment
- nextalign
- fasttree
- treetime
- dta

That's our working pipeline complete! We now need to provide two pieces of
information: a `seeds.txt` file, containing the seeds for our analysis, and
the `beta.fasta` file, which is available through controlled access via GISAID
(if you are attending a GRAPEVNE workshop then this file will be provided
in-person).

In order to include a file (the `beta.fasta` file) from your local file system
we have some choices, but the simplest is to drag the `LoadFile` module into
our graph at the top of the workflow and connect it to the `fasta` input.
Within this module, ensure that the path to the local file is correctly
specified.

Finally, we need to provide the seeds for our analysis. We will do this by using
a module that supplies a seeds-file, `provide_seeds`. Conceptually, this module
could be replaced with a local file, a database query, or a prompt which asks
the user which seeds to use. However, we are demonstrating that _resources_
can be provided along with our workflow modules (in-fact, all scripts that are
used in this analysis are also resources which are downloaded automatically
when the workflow is run).

We now need to connect the `provide_seeds` module in to our workflow. But where
should we connect it? While intuitively you might want to connect it to the
first module (`provide_seeds`), or indeed connect it to all modules (which would
also work), we actually only need to connect the `provide_seeds` module in to
the _final_ module of the workflow: the `dta` module in our case. This is
because snakemake is a _build-system_, which means that we specify the desired
output, and snakemake will work out the necessary steps to provide that result.
Our graph acts to provide a clear sequence of steps that must be undertaken
to take us from the provide `beta.fasta` file, to the desired trait anlaysis
for our seeds of interest (`dta` and `provide_seeds`).

You workflow should now be ready to run. Select `Build & Test` and then wait
for the workflow to finish (this should take less than 10 mins on a modern
laptop).

## Change the tree estimation method

By now the workflow should have completed and you should have access to the
various files generated during the run.

Let us now imagine that we want to change the workflow and try out a different
maximum likelihood method for tree estimation. In particular, we want to replace
the `fasttree` module with another: the `iqtree` module.

Delete the `fasttree` module. Drag in and connect up the `iqtree` module. Done.

Re-run the workflow.
