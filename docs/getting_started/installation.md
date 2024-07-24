# Installation

## Download

You can download the latest version of GRAPVEVNE for your system from
[github releases](https://github.com/kraemer-lab/GRAPEVNE/releases) and get started straight away!

For Windows users, ensure you have [PowerShell](https://learn.microsoft.com/en-us/powershell/), which comes pre-installed as standard on most modern versions of Windows.

GRAPEVNE comes with all of the necessary software to build and launch workflows, including `Python` (v3.11), `Snakemake` (v7) and `mamba` (the recommended distribution to use is [mambaforge](https://github.com/conda-forge/miniforge#mambaforge). To launch workflows outside of GRAPEVNE you will require these dependencies to be installed on your system.


### Module repositories

```{note}
You don't need your own module repository to use GRAPEVNE, instead you can make use of repositories setup by others (including for the tutorials).
```

If you decide you do want to set-up your own repository, then please be aware that GRAPEVNE will expect the repository to be structured in the following way:

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

Within a module you should follow the standard conventions outlined in the snakemake
[Distribution and Reproducibility guidelines](https://snakemake.readthedocs.io/en/stable/snakefiles/deployment.html).

You can also clone an existing repository (such as the [vneyard](https://github.com/kraemer-lab/vneyard)) as a base environment to kick-start your own repository.

## Developer build

GRAPEVNE comes with a dev container (located in `.devcontainer`).

For manual build, you will need to have the following dependencies installed:
- Python 3.11
- Nodejs 18
- [yarn 4](https://yarnpkg.com/) package manager (see [installation instructions](https://yarnpkg.com/getting-started/install)

To build locally, clone the GRAPEVNE repository and run the build script:

```
git clone git@github.com:kraemer-lab/GRAPEVNE.git -b main
cd GRAPEVNE
./build.sh
```

```{note}
On modern MacOS machines with M1/M2 processors you will likely need to install the
following additional dependencies in order to allow `node-canvas` to compile. These can
be installed via homebrew:
`brew install pkg-config pixman cairo glib pango`
or conda:
`conda install pkg-config pixman cairo glib pango`. No additional installation is
necessary if you are using the dev-container.
```

This will generate the GRAPEVNE Builder app for your system, located in
an appropriately named subfolder of `electron-app/out`.
