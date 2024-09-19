# Installation

## Download

You can download the latest version of GRAPVEVNE for your system from
[github releases](https://github.com/kraemer-lab/GRAPEVNE/releases) and get started straight away!

For Windows users, ensure you have [PowerShell](https://learn.microsoft.com/en-us/powershell/), which comes pre-installed as standard on most modern versions of Windows.

GRAPEVNE comes with all of the necessary software to build and launch workflows, including [Python](https://www.python.org/), [Snakemake](https://snakemake.github.io/) and mamba (we use [miniforge](https://github.com/conda-forge/miniforge)). To launch workflows outside of GRAPEVNE you will require these dependencies to be installed on your system.


### Module repositories

To use GRAPEVNE you will need to have access to one or more module repositories. These are collections of modules that you can use to build your workflows. You can create your own module repositories, although we recommend sticking with the defaults for now if you are new to GRAPEVNE.

```{note}
You don't need your own module repository to start use GRAPEVNE, there is a default repository that includes all modules necessary for the tutorials (along with many additional ones).
```

A module repository is simply a folder that is structured in a particular way. These can be stored locally on your machine or on a remote repository such as GitHub. We recommend setting your repository up directly in GitHub and then cloning it to your computer for use (instructions below) as this will make it easier to version-track, share and collaborate with others at a later date.

We provide a GitHub template that you can use to set-up your repository. To use this template you must have a GitHub account. Then, navigate to the [vneyard-template](https://github.com/kraemer-lab/vneyard-template) repository and click the green "Use this template" button. You will be asked to provide a repository name (e.g. `vneyard`) and whether you want to make the repository Public or Private at this tiem. Once done, this will create a new repository in your account with the correct structure.

```{note}
The template also provides several quality-of-life features such as a README template and a GitHub Actions workflow to check your modules for errors when uploading. We also provide an action to generate a module manifest file for you each time changes are made to your repository. These actions are not required, but are recommended to improve usability.
```

You can now download modules from this repository directly (we provide one sample module to get you started), or clone the repository to your local machine in order to make changes and start adding your own modules and workflows.

#### Remote access (read-only)

To access the repository immediately, open GRAPEVNE and go to the `Settings` panel. 

#### Local access (read and write)

To make changes to the repository it is necessary to 'clone' (make a local copy) of the repository from GitHub onto your local machine. This can be done from GRAPEVNE by navigating to the `Settings` panel and clicking the `Clone` button (found in the `Repositories` pane). You will be asked where to save the repository on your computer, at which point the repository will be downloaded and added to your repositories list. _Note: you only need to have the 'local' repository in your repositories list, since this provides access to all of your modules, and allows you to make changes to them / add new module._

Any updates made to the repository on GitHub will be indicated to you and synchronised to your local repository through the GitHub (icon that appears next your 'local' repository entry in the repositories list).

If you make changes to any of the modules in your repository, or add new modules, the GitHub icon will likewise indicate those changes and signify that these can be 'pushed' to the repository on GitHub. This way we can keep the local ('working copy') and remote ('published') repositories in sync with each other.

#### Folder structure

The structure of a module repository should look like this:

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
the base repository folder (`vneyard`, the project name `MyModules` and the
list of modules themselves (e.g. `MyModule1`) can be changed.

## Developer build

GRAPEVNE comes with a dev container (located in `.devcontainer`).

For manual builds you will need to have the following dependencies installed:
- [Python 3.12](https://www.python.org/) and the [uv](https://github.com/astral-sh/uv) package manager
- [Nodejs 20](https://nodejs.org/en) and the [yarn 4](https://yarnpkg.com/) package manager

To build locally, clone the GRAPEVNE repository and run the build script:

```
git clone git@github.com:kraemer-lab/GRAPEVNE.git -b main
cd GRAPEVNE
./build.sh
```

```{note}
On modern MacOS machines with M-Series processors you will likely need to install the
following additional dependencies in order to allow `node-canvas` to compile. These can
be installed via homebrew:
`brew install pkg-config pixman cairo glib pango`
or conda:
`conda install pkg-config pixman cairo glib pango`. No additional installation is
necessary if you are using the dev-container.
```

This will generate the GRAPEVNE Builder app for your system, located in
an appropriately named subfolder of `electron-app/out`.
