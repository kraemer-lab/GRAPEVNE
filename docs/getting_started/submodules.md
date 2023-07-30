# Sub-modules

One of the great benefits of modular construction is the capacity to (re)-use
components in a hierarchy - providing high level modules that make use of lower
level modules to provide abstraction, accessibility and reuse. We can
demonstrate this principle by making use of the previous tutorial modules.

So far we have made use of pre-constructed modules that are published online.
Now, we want to make use of these modules to construct module grouping, and to
make use of those groupings in a hierarchical fashion. This requires us to be
able to store our modules somewhere - and specifically, in a repository.

Let us begin by taking the `build.zip` file that you constructed in the previous
tutorial and unzipping it into a folder somewhere (most likely in your
`Downloads` folder). You will now have a folder called `build` that contains
the Snakemake workflow files and configuration for the previous tutorial.
Rename the folder to something more descriptive, such as
`PlotCovidData`.

## Module repositories

Repositories in GRAPEVNE follow a strict folder structure, which we must now
make in order for GRAPEVNE to recognise your module. Create the following folder
structure in the directory of your choice (e.g. in `Downloads`) and copy your
module into the `modules` folder:

```
vneyard                     <--- root repository folder
└── workflows               <--- workflows folder (required)
    └── My Modules          <--- project name
        └── modules         <--- modules folder
            └── PlotCovidData
```

The folders `workflows` and `modules` are required names, whereas the names of
the base repository folder (`vneyard`, the project name `My Modules` and the
list of modules themselves (`PlotCovidData`) can be changed
(but should be present).

## Navigating to a local repository

To navigate to a local repository in GRAPEVNE, open the `Settings` menu,
select `Local filesystem` from the `Repository` drop-down box, and enter the
path to the root repository folder in the url text box (e.g.
`/Users/home/MyUserName/Downloads/vneyard`). Now close the settings menu (by
clicking on the `Settings` button again) and refresh the modules list by
clicking `Get Module List`. After a few seconds you should see the modules list
change to include only one module: `PlotCovidData`.

## Editing modules

Before we go any further, clear the graph (this will also delete the test build
folder to provide a clean build environment). Now, drag your
`PlotCovidData` module into the main graph area. Notice that it
appears as a 'source' module, i.e. one without any inputs. This is because
when you build the module all input ports were connected. Remember that this
module now represents all of the previous modules that we built, and we can test
build the module in order to demonstrate this (doing so will require the build
environment to download again, so this may take some time).

We now have a choice - are we happy with the module as it stands, or do we want
to want to make it more generalizable?

### Altering parameters

If all we want to do is change a parameter of the analysis, then we can
accomplish this by clicking on the node. Notice when you do this that the
node information contains all of the configuration settings for the previous
five modules, combined in a structured fashion. Due to this, it is incredibly
simple to locate the url of the file that is downloaded, or the name of the
country that we are filtering for, and to change them directly in this
interface. **Doing so will not change the module configuration in your
repository**. GRAPEVNE does not write changes to repositories. If you make
parameter changes to your workflows then you can execute them directly in
GRAPEVNE and/or build them to a new workflow file that can be shared with others.
The original module specification remains unchanged.

### Expanding modules

If we want to take a closer look at a module, or if we want to change something
more fundamental in the workflow - for example, we may want to remove the
`Download` function to generalize the module, then we need
to expand the module into its constituent parts.

Click on the `PlotCovidData` module so that its information
pane appears on the right. Since this is a module made up of other modules,
you will notice a new button has appeared in the top-right-hand corner, named
`Expand`. Click this button now, then tidy up and graph (click `Arrange graph`)
and you should see a familiar sight!

```{note}
Before we go any further, notice that although we are currently browsing our
own (local) repository, the module is constructed from nodes that are part of
another repository. This allows for easy sharing and reuse of modules. Although
we reference the modules by a github path and `branch` (which provides the
latest updates), you can also reference modules by `commit` in order to ensure
that you always using the same version.
```

### Modules with dependencies

Delete the `Download` module from your graph, as-well as the two `Plot` modules.
Your graph should now contain only two modules: `Filter` and `AggregateByMonth`.
Build the workflow (`Build / Zip`) and save the resulting zip. Unzip it, name
the folder `FilterAndAggregateByMonth`, then place it into the `modules`
folder in your local repository. Refresh GRAPEVNE by clicking `Get Module List`.
You should now see two modules in your repository: `PlotCovidData` and
`FilterAndAggregateByMonth`.

Clear the graph (`Clear Graph`), then drag `FilterAndAggregateByMonth` in the
main graph area. Notice that the module appears as a standard module with a
single input port (whose name reflects the sub-module [and specific port] to
which it connects).

Drag a `Download` module into the scene, change its parameters to:

```
url: https://covid19.who.int/WHO-COVID-19-global-data.csv
filename: data.csv
```

then connect it to the input port of
`FilterAndAggregateByMonth`. Drag a `Plot` module into the scene and
connect it to the output of `FilterAndAggregateByMonth`. If you `Build and Test`
the workflow at this point then you should see our familiar aggregated data
graph.

```{note}
At present each module is limited to a single output, meaning that modules do
not currently support branching workflows,  so we cannot fully
recreate our previous graph (which plotted directly from the `Filter`
module also).
```

This module is much more useful as it provides composite functionality, while
permitting input and output to and from any other compatible modules.

### Expanding a connected module

Click on the `FilterAndAggregateByMonth` module to bring up its information
panel. Notice that the `Expand` button is visible as this module is constructed
from sub-modules. Click on `Expand`, then tidy up the graph by clicking
`Arrange graph`.

Notice that both the input and output connection(s) are preserved. This allows
you to expand modules in your graph without loosing continuity. Such
functionality would allow you to, for example, expand the node and replace
a sub-node (let us say the `AggregateByMonth` module in this case) with
another module. Although the example given here is straightforward, we envisage
these modules / sub-modules representing rich hierarchic architecture of
processes that can be easily swapped in and out (and even tested) within the
editor.
