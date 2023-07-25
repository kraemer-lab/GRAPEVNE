# Quickstart

## GRAPEVNE Builder

GRAPEVNE Builder is the graphical interface that assists you in graphing,
manipulating and building GRAPEVNE workflows.

_These instruction are being developed and are currently incomplete._

### Build your first workflow

Construct a small graph of nodes

1. Node provides data
2. Node pre-processes data
3. Node summarises data

### Modify workflow parameters

Change pre-processing step(s) and/or summary data metrics

### Build the workflow

Build

### GRAPEVNE Runner - launch and monitor your workflow

Launch and monitor in Runner interface

### Drop-in submodule replacement

Expand pre-processing subnode (into ~3 nodes) and replace one of those subnodes
with a different module from those available.

Modify the parameters of the new node

Build the new workflow and execute

### Build your pipeline as a new module

Remove input node

Build workflow

Clear graph

### Re-use your workflow

Import workflow as module

Connect-up a different input (different file source)

Build and run

### Hierarchical modules

Workflow expands in a hierarchy, permitting submodules to be modified and/or
replaced.

### Writing the base modules

Many modules are / will-be available as generalised 'utility' modules for use,
supporting a range of functions such as file format conversion, column renaming,
even event notification.

Workflow builder relies on modules

These are written in Snakemake.

These can be thin wrappers around existing code/programs (including R scripts,
etc.), or more complex multi-rule pipelines.

See the following tutorials for details of module construction.
