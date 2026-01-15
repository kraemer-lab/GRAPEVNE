# Installation

## Download

You can download the latest version of GRAPVEVNE for your platform from
[github releases](https://github.com/kraemer-lab/GRAPEVNE/releases) and get started straight away:

<div style="text-align: center; margin-bottom: 20px;">
    <a href="https://github.com/kraemer-lab/GRAPEVNE/releases" download style="display: inline-block; margin: 0 auto 20px auto; padding: 15px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-size: 18px;">
    Download GRAPEVNE
    </a>
</div>

For Windows users, ensure you have [PowerShell](https://learn.microsoft.com/en-us/powershell/), which comes pre-installed as standard on most modern versions of Windows.

GRAPEVNE comes with all of the necessary software to build and launch workflows, including [Python](https://www.python.org/), [Snakemake](https://snakemake.github.io/) and mamba (we use [miniforge](https://github.com/conda-forge/miniforge)). To launch workflows outside of GRAPEVNE you will need these dependencies to be installed on your system.

## Developer build

GRAPEVNE comes with a dev container (located in `.devcontainer`).

For manual builds you will need to have the following dependencies installed:
- [Python 3.13](https://www.python.org/) and the [uv](https://github.com/astral-sh/uv) package manager
- [Nodejs 22](https://nodejs.org/en) and the [yarn 4](https://yarnpkg.com/) package manager

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
