# Phyloflow

Interactive environment for building and validating phylogenetic data workflows built around [Snakemake](https://snakemake.github.io/).

Status: **concept / prototyping**

### Background

Phylogenetic analysis is a standard method in bioinformatics to track the origin and evolution of mutations in genome sequences. Within the context of an evolving epidemic or a pandemic, construction of phylogenetic trees is essential to understand the trajectory of an epidemic as well as their geographic spread. With such analyses virus movements can be tracked between different locations at different time points. Such work has been used to show the effectiveness, or lack thereof, of non-pharmaceutical interventions, in particular, the effect of travel restrictions on pandemic spread.

Construction of time calibrated phylogenetic trees is a manual and time-intensive task, in part due to the time complexity of some of the analysis steps (BEASTv1, a widely used tool for time calibrated phylogenetic tree construction, typically requires a week on a cluster if not more), but also due to large variations in the process. Each of the multiple steps can have variations in the algorithms, methods or tools required for that particular step, as well as having variations in input parameters that tune the output of the algorithm or tool.

This work is an attempt to standardize the analyses of large viral genomic datasets for the most common use cases. It recognises that there is no singular pipeline or set of parameters that will work for every scenario, and instead provides a way for the user to switch between sets of tools at each step of the workflow. Outputs and inputs for each step in the data pipeline are to be checked to verify that they are in a compatible and appropriate format, and it is easy to monitor the progress of the workflow.

### Project Objectives

- Provide a set of modular workflows that can be used individually and can be combined and extended with workflows from outside sources.
- Provide a graphical interface for workflow construction. Should be able to inform the user about compatible modules which can be connected together graphically. Export to workflow file which can be checked into version control.
- Provide documentation on best practices in the field of phylogenetic analysis as well as subsequent geospatial analyses.
- Allows the user to monitor the workflows, ideally with a graphical interface.
