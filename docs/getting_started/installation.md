# Installation

## Download

You can download the latest version of GRAPVEVNE for your system from
[github releases](https://github.com/kraemer-lab/GRAPEVNE/releases).

For Windows users, ensure you have
[PowerShell](https://learn.microsoft.com/en-us/powershell/), which comes
pre-installed as standard on most modern versions of Windows.

GRAPEVNE includes all of the necessary software needed to build and launch
workflows bundled as part of the application (namely snakemake and python).

However, it is still recommended that you install a version of `conda` on your
system since many workflows (including the GRAPEVNE tutorials) make use of conda
environments for package management. The recommended distribution to use is
[mambaforge](https://github.com/conda-forge/miniforge#mambaforge).

### Module repositories

The GRAPEVNE Builder reads modules from a repository.

```{note}
You don't need your own repository to use GRAPEVNE, instead you can make use of
repositories setup by others (including for the tutorials).
```

If you do want to set-up your own repository, then please be aware that GRAPEVNE
expects the repository to be ordered in a particular fashion, namely:

```
vneyard                     <--- root repository folder
└── workflows               <--- 'workflows' folder (name must match)
    └── MyModules           <--- project name
        └── modules         <--- 'modules' folder (name must match)
            └── MyModule1   <--- module folders
            └── MyModule2
            └── MyModule3
```

The folders `workflows` and `modules` are required names, whereas the names of
the base repository folder (`vneyard`, the project name `My Modules` and the
list of modules themselves (e.g. `MyModule1`) can be changed.

Within a module (e.g. `MyModule`) there is a (strongly recommended) folder
convention that follows the snakemake
[Distribution and Reproducibility guidelines](https://snakemake.readthedocs.io/en/stable/snakefiles/deployment.html).

You can also clone an existing repository (such as the
[vneyard](https://github.com/kraemer-lab/vneyard)) as a base environment.

## Developer build

If you intend to contribute towards GRAPEVNE, or simply wish to build from
source, then follow these instructions.

Dependencies:

- Python 3.9+
- Nodejs 16+
- [yarn](https://yarnpkg.com/) package manager (can be installed through npm as
  `npm i yarn`)

To build locally, clone the GRAPEVNE repository and run the build script:

```
git clone git@github.com:kraemer-lab/GRAPEVNE.git -b main
cd GRAPEVNE
./build.sh
```

This will generate the GRAPEVNE Builder app for your system, located in
an appropriately named subfolder of `electron-app/out`.
