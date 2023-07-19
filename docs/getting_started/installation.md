# Installation

PhyloFlow is currently in development and must be built before running. At
present we only test support on Linux/MacOS. We hope to make binary builds of
Phyloflow available through github releases soon (Q3 2023).

Dependencies:

- Python 3.9+
- [yarn](https://yarnpkg.com/) package manager

To build and run locally, clone the phyloflow repository and launch:
`build.sh` from the command line. This will build and launch an electron app.
After the initial build you can launch the by running `run.sh` (this will
start a virtual environment and launch the app).

Note: You will need to select 'github directory listing' from the Builder drop-down to access modules. Local modules must (currently) be stored in a specific directory structure mirroring the SnakeShack.

## Snakeshack

To make a copy of the modules repository available on your local machine, clone the SnakeShack ([https://github.com/jsbrittain/snakeshack](https://github.com/jsbrittain/snakeshack)) into a sister folder to PhyloFlow, e.g.:

```
repos
|- phyloflow
|- snakeshack
```

Phyloflow should now be able to find the local modules.
