# Validation checks

There are many forms of validation can be applied to a workflow. These range
from assessing
whether modules are compatibile with one another, to data-depedent validation
procedures.
The latter (data-depedent validation) can generally only be assessed when data
become available in the workflow, and as such are best handled by Utility
modules that are designed to verify file-formats, file-contents, etc.

Module compatibility on the other hand, can be assessed during construction of
the workflows directly in the GRAPEVNE Builder. This is
achieved by checking which depedencies are being fullfilled - and which are not -
for a particular module.

We can demonstrate this process by making use of the `Download` and `Filter`
modules from the `Builder Tutorial` set.

Open the GRAPEVNE Builder, or clear the current graph (performing either action
will automatically delete any previous `Test` builds). Ensure that your
repository is set to `Directory Listing (github)` and `kraemer-lab/vneyard`,
then click `Get Module List`. Once the modules load, filter the list to include
only those belonging to the `Tutorial Builder` group.

Now, drag the `Download` module into the main graph building area, but this
time leave the default values as they are. Now, drag a `Filter` module into
the graph and connect the `Out` port of the `Download` module to the `In` port
of the `Filter` module.

_Notice that when you draw this connection, the `Filter` module will turn grey
for several second and, in this case will then turn red_

A red module indicates that its dependencies are not being met given its current
inputs. However, we constructed exactly this graph earlier without issue, so
what is the problem?

The problem lies in the fact that the `Filter` module is (by default) set to
look for (and read) from a file called `data.csv`. As the `Download` module is
currently set to retrieve the Snakemake logo (a `.png` file), this dependency
is not being fullfilled, and so this is indicated by the module turning red.

To resolve the problem, in this case, we want to change the output filename
from the `Download` module so that it remains compatible with the `Filter`
module. To do this, click on the `Download` module and change the `filename`
parameter (`config-params-filename`) to `data.csv`. Note that the module remains
red for the time being.

Module dependencies are assessed when new links are made between modules - but
this process is quite computationally intensive, so to re-run the validation
check it is necessary to open the module of interest (by clickng on it; click
on the `Filter` module now),
and then click on the `Validate` button that appears at the top of the
information panel. Do this and you should see the module first turn grey
(indicating that the validation check has started), and then turn Blue,
indicating that all is well and the module dependencies are being met through
its inputs.

```{note}
In practise, these checks are implemented (in the background) by attempting to
build a workflow graph for the specific module in isolation. This produces a
list of dependencies that are not currently being fullfilled. We then build
another workflow graph, this time including its parent connections (its
immediate, first-order inputs). If those modules fullfill all of the original
missing dependencies (acknowledging that they will report their own [separate]
dependencies that may be missing), then we know that the target module has its
dependencies fullfilled. By applying this philosophy iteratively throughout the
graph, we can assess whether each module is being provided with appropriate data
and can highlight the specific modules that are not.
```

It is also worth noting that although the modules are now seen as compatible by
GRAPEVNE, we did not actually change the url of the file that we are downloading,
therefore if we ran this workflow now we would receive an error since the
`Filter` module would attempt to open `data.csv` as a comma-separated-variable
file, whereas it is infact just a renamed `png` image. This highlights the
fundamental difference between
a dependency that we can assess during construction (basic syntax and
requirements checking), versus a data-dependent check, that requires the
workflow to run in order to load and validate data files, to ensure that the
data being received is of the correct type and in the correct format.

We could in-fact place a very simple data-validation module into our pipeline
in-between the `Download` module and the `Filter` module. Or (as would perhaps
be more fitting in this example) we could apply data validation checks during
the reading of the `csv` file itself, as part of the `Filter` module. Either
option is available depending on the requirements of the situation.
