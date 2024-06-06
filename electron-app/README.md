# GRAPEVNE Builder

GRAPEVNE Builder is the graphical interface that allows modules to be connected
to one another and built to snakemake workflows (that can themselves be imported
back into the builder). This permits the construction of hierarchical pipelines.

The GRAPEVNE builder is distributed for download as a binary executable via
[github Release](https://github.com/kraemer-lab/GRAPEVNE).

The GRAPEVNE Builder uses `electron` to encapsulate a typescript/Redux-React
front-end, with a Nodejs/Python backend. The Python backend is first compiled to
binary using `PyInstaller` and queried as a subprocess. GRAPEVNE bundles `snakemake`
as part of the install.

## Publishing workflow

To publish the GRAPEVNE Builder follow these steps:

1.  Increment the version number (`yarn version`)
2.  Push the version 'tag' to github (`git push --follow-tags`)

Publishing the tag will trigger the github action `Publish` creating a new
_draft_ release (e.g. v1.0.0) and populates it with builds as configured in
`forge.config.js`.

## Upgrading electron

GRAPEVNE was originally built using electron v26, which supports chrome M116
(see [Electron Releases](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)).
As such the version of chromedriver used for end-to-end testing was pegged
to chromedriver 116 in a number of locations:

- Update `package.json` in `./electron-app`:
  - `yarn add electron@27`
  - `yarn add --dev electron-chromedriver@27`
- `./electron-app/postbuild_tests/modules.test.ts`
  - `driver = new webdriver.Builder().forBrowser("chrome", "116")`
- Github workflows (github runners update their chromedriver regularly):
  - Line `chromedriver-version: '116.0.5845.96'` in:
    - `./.github/workflows/postbuildchecks.yml`
    - `./.github/workflows/publish.yml`
    - `./.github/workflows/nightly.yml`
