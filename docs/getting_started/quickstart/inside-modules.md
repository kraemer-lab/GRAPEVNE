# Inside the tutorial modules

So what's inside the pre-prepared modules that we have already come across?
Let's take a look...

## Tutorial Builder

### Download

The `download` module is both the first rule in out tutorial pipeline, and the simplest to explain. That being said, we will also discuss the folder structure and accompanying files while introducing this modules.

`Download` makes use of a command called `wget` in order download (and rename) a file from a url address. But how do we ensure that this particular command is available on any computer? For this we make use of virtual environments, in particular [`conda`](https://docs.conda.io/projects/conda/en/latest/index.html) environments. These are natively supported by Snakemake so provide a natural mechanism to handle application dependencies.

The file structure for this module looks like this:

```
Download
├── config
│   └── config.yaml
└── workflow
    ├── Snakefile
    └── envs
        └── conda.yaml
```

There are three files of interest:

- `Snakemake`: contains the rules for the module,
- `config.yaml`: contains the configuration information, which is displayed in
  GRAPEVNE when you click on a module.
- `conda.yaml`: contains information concerning the conda environment

The `config.yaml` file contains the following:

```yaml
input_namespace: null
output_namespace: out
params:
  url: "https://snakemake.github.io/img/jk/logo.png"
  filename: "snakemake.png"
```

The `Snakefile` file contains the following:

```python
configfile: "config/config.yaml"

import shutil
from snakemake.remote import AUTO

indir=config["input_namespace"]
outdir=config["output_namespace"]
params=config["params"]
filename=params["filename"]

rule target:
    input:
        url=AUTO.remote(params["url"]),
    output:
        outfile=f"results/{outdir}/{filename}",
    log:
        f"benchmark/{outdir}.txt"
    benchmark:
        f"benchmark/{outdir}"
    conda:
        "envs/conda.yaml"
    shell:
        """
        shutil.move(input.url[0], output.outfile)
        """
```

The `conda.yaml` file contains the following:

```yaml
channels:
  - bioconda
```

The contents of `config.yaml` should look familiar, as it reflects the module configuration as seen in GRAPEVNE (you can double-check this by dragging the `Download` module into the main graph area and clicking on it). Note that the `input_namespace` is explicitely declared `null` to reflect the fact that this module does not take any inputs, and instead operates a 'source' module.

The `conda.yaml` file is a minimial example that simply declares a channel, but does not list any additional requirements or dependencies. These will become more interesting in the next module.

The `Snakefile` contains the rules (or 'rule' in this case) for the module. The file begins by specifying the location of the `config.yaml` file. Note that we declare `indir`, `outdir` and `params` as convenience variables so that we do not have to type `config["input_namespace"]`, etc. throughout the rest of the file. Also note that Snakefile's may contain python code, and we take advantage of this to import `AUTO` from `snakemake.remote` to assist us in declaring the url file as a remote dependency (see below).

The main rule itself `target` declares an `input` (the location pointed to by the url), an `output file` (the destination filename to use; note that this resides in `results/{outdir}`, and a `shell` command that uses `wget` to retrieve the file at the given url. The use of `AUTO.remote` tells Snakemake that this file is a remote file and should be downloaded. There are some additional directives: `conda` provides the path to the conda environment file; `log` provides the path to store log-files related to this rule; `benchmark` provides the path to store benchmark timings for rule execution.

And that's it for a first module!

### Filter

The filter module is more interesting in several respects: it takes an input namespace from another module, declares application dependencies, and runs a custom script to process data. The folder structure of the `Filter` module is similar to that of `Download`, with the addition of a `resources` folder that contains the custom script, and a dummy input file that we use for testing, in the `results` folder):

```
Filter
├── config
│   └── config.yaml
├── resources
│   └── scripts
│       └── filter.py
├── results
│   └── in
│       └── data.csv
└── workflow
    ├── Snakefile
    └── envs
        └── conda.yaml
```

The `config.yaml` file contains the following:

```yaml
input_namespace: in
output_namespace: out
params:
  Source: "data.csv"
  Filters:
    Country_code: "ZA"
```

The `Snakemake` file contains the following:

```python
configfile: "config/config.yaml"
import json

indir = config["input_namespace"]
outdir = config["output_namespace"]
params = config["params"]
filename=params["Source"]

rule target:
    input:
        source=f"results/{indir}/{filename}",
        script=srcdir("../resources/scripts/filter.py"),
    output:
        f"results/{outdir}/{filename}",
    log:
        "logs/test.log"
    params:
        filters=json.dumps(params["Filters"]).replace("\"", "\'"),
    conda:
        "envs/conda.yaml"
    shell:
        """
        python {input.script} \
            --source="{input.source}" \
            --dest="{output}" \
            --filters="{params.filters}" \
        """
```

Here we see the main Snakefile and associated configuration file. The Snakefile declares all of the directives that we saw previously, with the addition of `params` which is used to pass parameters from the configuration file into the `shell` directive. Also note that the `input` directive associates names with the two inputs (one is a 'source' file, to be provided by another module; the other is the script to execute [it is not strictly necessary to declare these here]). The `shell` directive shows that the rule itself will launch a `python` script to process the data. Despite the fact that Snakefile's are natively pythonic themselves, we could launch any application, such as R-scripts or shell commands from here - we simply use a python script as a convenient example in this case.

That filtering script itself is located in `resources/scripts/filter.py` and contains the following (note that it is not necessary to fully comprehend this file if you are not familiar with python - just note that we `import` several dependencies at the top of the file and will need to tell Snakemake where to find these in a moment...):
```python
import json
import argparse
import pandas as pd


def Filter(
    source: str,
    dest: str,
    filters: dict = {},
) -> None:
    # Read data
    df = pd.read_csv(source)

    # Filter data
    for k, v in filters.items():
        df = df.loc[df[k] == v]

    df.to_csv(dest, index=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=str, default="")
    parser.add_argument("--dest", type=str, default="")
    parser.add_argument("--filters", type=str, default="")

    Filter(
        source=parser.parse_args().source,
        dest=parser.parse_args().dest,
        filters=json.loads(parser.parse_args().filters.replace("\'", "\"")),
    )
```

As mentioned, this file processes the data, but depends on several applications and libraries - not least of which is `python` itself, which may not be installed on the host computer. To declare these dependencies (and allow Snakemake to initialise a conda environment in which to download and prepare these requirements), we make use of the `conda.yaml` file, which is set-up as follows:

```yaml
channels:
  - bioconda
dependencies:
  - pip:
      - numpy
      - pandas
```

The file states that in order for this rule to execute correctly, we need `pip` (the third-party package installer for python), as-well as several python packages installed through pip, namely `numpy` and `pandas` (note that Python must already be installed to run Snakemake, although you can tag a specific version in the environment file if you wish, just be aware that this will increase the download size and setup time of the module). The current example could almost certainly be written in a more efficent way, but it provides an informative example.

When the `target` rule is run, the conda environment is set-up and launched. Then, the shell command is executed that environment, and the environment is finally closed down once the command finishes executing. The output of the command is a file, written to `{output}` (or, in this case `results/out/data.csv`). Note that an alternative implementation would be to import the `filter.py` file directly into the Snakefile and call it as a Python module, but this approach only applies to Python scripts and as such is not as flexible as the current approach.

This module demonstrates the broad applicability and functionality of Snakemake. Finally, we note that in order to develop and test the module (outside of GRAPEVNE) it is useful to specify default values for the input and output namespaces (usually "in" and "out", respectively), as-well as providing a surrogate file to simulate incoming data (in this case as small `data.csv` file is placed in the `results/in` folder). These do not contribute during normal workflow execution.

### Aggregate By Month

The `AggregateByMonth` module follows the same pattern as the `Filter` module, except for the specifics of the script file and associated dependencies. To view these files, see the corresponding github folder: [AggregateByMonth](https://github.com/kraemer-lab/vneyard/tree/main/workflows/Tutorial Builder/modules/AggregateByMonth).

### Select

Likewise the `Select` module follows a similar pattern to both the `Filter` and `AggregateByMonth` modules, excepting the specifics of their implementation in the script file, and associated dependencies. To view these files, see the corresponding github folder: [Select](https://github.com/kraemer-lab/vneyard/tree/main/workflows/Tutorial%20Builder/modules/Select)

### Plot

The `Plot` module also follows a similar pattern to the above modules, but provides a graphical output. While we have (again) utilised `python` (and the `matplotlib` library in this case), we could have just as easily implemented these scripts in R (using packages such as `seabourne`), or made use of any other languages or packages as needed. We simply need to ensure that the correct dependencies are listed in the `conda.yaml` environment file.

For demonstration purposes, the contents of the `resources/scripts/plotcol.py` file are:

```python
import json
import argparse
import pandas as pd
import matplotlib.pyplot as plt


def PlotColumn(
    source: str,
    col_x: str,
    col_y: str,
) -> None:
    # Read data
    df = pd.read_csv(source)

    df.index = df[col_x]
    series = df[col_y]

    # Plot data
    fig, ax = plt.subplots()
    ax.plot(series)
    if len(series) > 12:
        ax.xaxis.set_major_locator(plt.MaxNLocator(12))
    ax.set(xlabel=col_x, ylabel=col_y)
    plt.xticks(rotation=45)
    plt.show()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=str, default="")
    parser.add_argument("--col_x", type=str, default="")
    parser.add_argument("--col_y", type=str, default="")

    PlotColumn(
        source=parser.parse_args().source,
        col_x=parser.parse_args().col_x,
        col_y=parser.parse_args().col_y,
    )
```

The contents of the `conda.yaml` file are:

```yaml
channels:
  - bioconda
dependencies:
  - python
  - pip:
      - numpy
      - pandas
      - matplotlib
      - lxml
```

noting the inclusion of `matplotlib` to produce the graphical output, which is
installed by `pip` as a dependency.

## Summary

Here we have seen that constructing basic modules is incredibly simple, and
each module can contain as much (or as little) sophistication as required.
That is not to say that all modules are straightforward to implement, in
particular modules with data-dependencies offer unique challenges that we
cover elsewhere in the tutorial, but for the vast majority of cases the module
constuction process is flexible and can make use of the extensive resources
and applications already developed to overcome most challenges.

As a final note, while all of the modules shown here contain only a single
`rule`, this is not a restricton and multi-rule Snakefiles can be included
as modules. With this in mind also note that the `conda` directive applies at
the `rule` level, meaning multiple conda environment files can be provided,
each associated with a separate rule.
