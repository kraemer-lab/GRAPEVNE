# Installation

## Quickstart

_The first pre-release builds will be available Q3 2023_

Download the latest version of GRAPVEVNE for your system from
[github releases](https://github.com/kraemer-lab/GRAPEVNE/releases).

### Snakeshack

The GRAPEVNE Builder reads modules from a repository. This repository currently
has a specific folder structure that must be adhered to. The simplest way to
load modules for testing is therefore to ensure that you select
'github directory listing' from the repository drop-down menu to access
modules from a github repository.

To make a copy of the modules repository available on your local machine, clone
a [Snakeshack](https://github.com/jsbrittain/snakeshack)
and point GRAPEVNE to that folder by selecting 'Local filesystem' from the
repository drop-down menu and entering the snakeshack location on your computer.

GRAPEVNE should now be able to find and load modules locally. After building a
new module in GRAPEVNE, simply move the new module into the relevant folder of
the snakeshack and refresh the GRAPEVNE Builder to have access to that workflow
as a module!

To enable all of GRAPEVNE's building and running features you will also need to
ensure that you have `snakemake` installed and that it is accessible on your
system (`snakemake` is installable via the Python Package Index
[PyPI](https://pypi.org/project/snakemake/). We also strongly recommend that you
install the [`conda`](https://docs.conda.io/en/latest/) environment management
software ([`mamba`](https://github.com/mamba-org/mamba) is the recommended [faster]
alternative), as this will provide isolated environments to launch your modules
in with version locked software. Further details are available in our tutorial
documentation.

## Developer build

Dependencies:

- Python 3.9+
- [yarn](https://yarnpkg.com/) package manager

To build locally, clone the GRAPEVNE repository:

```
git clone git@github.com:kraemer-lab/GRAPEVNE.git -b main
```

then run `build.sh` from the command line. This will generate the GRAPEVNE Builder
app and will attempt to launch it (if running on an Apple Mac). If the app does
not launch you will find the relevant build in `electron-app/out`, in an
appropriately named subfolder for your operating system.
