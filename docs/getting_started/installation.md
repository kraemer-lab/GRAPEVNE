# Installation

## Download

You can download the latest version of GRAPVEVNE for your system from
[github releases](https://github.com/kraemer-lab/GRAPEVNE/releases).

For Windows users, ensure you have [PowerShell](https://learn.microsoft.com/en-us/powershell/), which comes installed as standard on modern distributions.

GRAPEVNE includes all of the necessary software needed to build and launch
workflows bundled as part of the application (namely snakemake, conda and python).
You can still use your own versions of these software by making the appropriate selections in the settings menu after install.

### Module repositories

You don't need your own repository to use GRAPEVNE, instead you can make use of
the repositories setup by others, and for the tutorials, etc.

The GRAPEVNE Builder reads modules from a repository. This repository
has a strict folder structure that must be adhered to. The simplest way to
load modules for testing is therefore to ensure that you select
'github directory listing' from the repository drop-down menu to access
modules from a github repository.

To make a copy of the modules repository available on your local machine, [clone
the repository](https://github.com/kraemer-lab/vneyard)
and point GRAPEVNE to that folder by selecting 'Local filesystem' from the
repository drop-down menu and entering the resoitory location on your computer.

GRAPEVNE should now be able to find and load modules locally. After building a
new module in GRAPEVNE, simply move the new module into the relevant folder of
the repository and refresh the GRAPEVNE Builder to gain access to that workflow
as a reusable module!

## Developer build

If you intend to contribute towards GRAPEVNE, or simply wish to build from
source, then follow these instructions.

Dependencies:

- Python 3.9+
- Nodejs 16+
- [yarn](https://yarnpkg.com/) package manager

To build locally, clone the GRAPEVNE repository:

```
git clone git@github.com:kraemer-lab/GRAPEVNE.git -b main
cd GRAPEVNE
./build.sh
```

This will generate the GRAPEVNE Builder app, which will be located in
an appropriately named subfolder of `electron-app/out`.
