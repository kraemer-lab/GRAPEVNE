# GRAPEVNE Builder

GRAPEVNE Builder is the graphical interface that allows modules to be connected
to one another and built to snakemake workflows (that can themselves be imported
back into the builder). This permits the construction of hierarchical pipelines.

The GRAPEVNE builder is distributed for download as a binary executable via
[github Release](https://github.com/kraemer-lab/GRAPEVNE).

The GRAPEVNE Builder uses `electron` to encapsulate a typescript/Redux-React
front-end, with a Python backend. The Python backend is first compiled to
binary using `PyInstaller` and queried as a subprocess. To use this software
effectively, `snakemake` should be installed and accessible.

## Publishing workflow

To publish the GRAPEVNE Builder follow these steps:

1. Increment the version number (`yarn version`)
2. Push the version 'tag' to github (`git push --follow-tags`)

Publishing the tag will trigger the github action `Publish` creating a new
_draft_ release (e.g. v1.0.0) and populates it with builds as configured in
`forge.config.js`.
