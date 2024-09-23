# Exploring the tutorial modules

So what's inside the pre-prepared modules that we have already come across?
Let's take a look...

## Tutorial Builder

### Download

The `download` module is both the first rule in our tutorial pipeline, and the simplest to explain. That being said, we will also discuss the folder structure and accompanying files while introducing the module.

Briefly, `Download` uses the `grapevne` wrapper framework to download a remote file, and the built-in Python package `shutil` to move that file to a given target location.

The file structure for the module looks like this:

```
Download
├── config
│   └── config.yaml
└── workflow
    ├── Snakefile
    └── grapevne_helper.py
```

There are three files of interest:

- `Snakemake`: contains the rules for the module,
- `config.yaml`: contains the configuration information, which is displayed in
  GRAPEVNE when you click on a module.
- `grapevne_helper.py`: a helper function to enable the import of the grapevne module.

The `config.yaml` file contains the following:

```yaml
input_namespace: null
output_namespace: out
params:
  url: "https://snakemake.github.io/img/jk/logo.png"
  filename: "snakemake.png"
```

You will notice that the `params` structure reflects the parameters that are displayed in the GRAPEVNE interface. The rest of these configuration parameters are hidden from the user, but are available to the module itself. Of note, the `input_namespace` (which is analogous to an input port in GRAPEVNE) is explicitely declared `null` to reflect the fact that this module does not take any inputs. The `output_namespace` is set to some predefined value (`out` in this case), but that is only for convenience when testing the module. These namespaces are remapped by GRAPEVNE when building connected workflows.

The `Snakefile` file contains the following:

```python
"""Download a file from a URL.

This module downloads a file from a URL and saves it so that it is accessible from the modules' output port.

Params:
    url (str): URL to download from
    filename (str): Name of the file to use in the workflow
"""
configfile: "config/config.yaml"
from grapevne_helper import import_grapevne
import shutil

grapevne = import_grapevne(workflow)
globals().update(vars(grapevne))

rule target:
    input:
        url=remote(params("url")),
    output:
        outfile=output(params("Filename")),
    log:
        log()
    benchmark:
        benchmark()
    run:
        shutil.move(input.url, output.outfile)

rule _test:
    input:
        output(params("Filename")),
```

The `Snakefile` starts with a docstring to provide a description of the module. This is displayed when you click on a module in GRAPEVNE. The file then continues by specifying the location of the configuration (`config.yaml`) file. In the editor, you can choose which presets / configuration file you want to use the module with, or even supply your own. The `Snakefile` also contains the rules for the module. Rules starting with "\_" are not imported into the workflow by GRAPEVNE, and so are used mainly for testing. In this case the "\_test" rule is successful if the output of the `target` rule has been created (we can add additional checks/logic here to interrogate the file contents if we choose to). Note that Snakefile's may contain python code, and we take advantage of this to import the `grapevne_helper`, along with `shutil` to assist us with a file move operation.

The main rule itself `target` declares an `input` (the location pointed to by the url), an `output file` (the destination filename to use, and a `run` command that uses `shutil` to move the file remote file to the desired target path. There are also some additional directives: `log` provides the path to store log-files related to this rule; `benchmark` provides the path to store benchmark timings for rule execution.

Let's talk briefly about the `grapevne_helper`. This is a script that is bundled with each grapevne module and is used to install our `grapevne` wrapper framework. In this example we have imported all of the wrappers into the Snakefile's global namespace with the `globals().update(vars(grapevne))` command. This is not strictly necessary, but it does make the code more readable. Let's take a look at how we use these wrappers in each of the `target` rules directives:
- `input:` we use the `remote` wrapper to download a URL. The URL itself is provided by the `url` parameter in teh configuration file, which we access via the `params` wrapper function.
- `output` we use the `output` wrapper to specify the location of the output file. The filename is provided by the `Filename` parameter in the configuration file, which we (similarly) access via the `params` wrapper function.
- `log` and `benchmark` use the `log` and `benchmark` wrappers to specify the location of the log and benchmark files, respectively.

And that's it for a first module!

### Filter

The filter module is more interesting in several respects: it takes input from another module, declares application dependencies, and runs a custom script to process data. The folder structure of the `Filter` module is similar to that of `Download`, with the addition of a `resources` folder that contains the custom script, an environment file for specifying conda dependencies, and a dummy input file that we use for testing, in the `results/in` folder):

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
    ├── grapevne_helper.py
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
"""Filter data based on a list of criteria

This script reads a CSV file and filters it based on a list of criteria. The list of criteria are provided as dictionaries in the config file.

Params:
    Source (str): "data.csv"
    Filters (list): List of criteria to filter the data by. For example, to filter by a CountryCode of "GB", the list would be ["CountryCode": "GB"]
"""
configfile: "config/config.yaml"
from grapevne_helper import import_grapevne
import json

grapevne = import_grapevne(workflow)
globals().update(vars(grapevne))


rule target:
    input:
        source=input(params("Source")),
        script=script("filter.py"),
    output:
        output(params("Source")),
    log:
        log("test.log")
    params:
        filters=json.dumps(params("Filters")).replace("\"", "\'"),
    conda:
        env("conda.yaml")
    shell:
        """
        python {input.script} \
            --source="{input.source}" \
            --dest="{output}" \
            --filters="{params.filters}" \
        """

rule _test:
    # Removed for brevity
    ...
```

Here we see the main Snakefile and associated configuration file. The Snakefile declares all of the directives that we saw previously, with the addition of `params` which is used to pass parameters from the configuration file into the `shell` directive. Also note that the `input` directive associates names with the two inputs (one is a 'Source' file, to be provided by another module; the other is the script to execute. The `shell` directive shows that the rule itself will launch a `python` script to process the data. Despite the fact that Snakefile's are natively pythonic themselves, we could launch any application, such as R-scripts or shell commands from here - we simply use a python script as a convenient example in this case.

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

As mentioned, this file processes the data, but this script also depends on several other Python packages which may not be installed on the host computer. To declare these dependencies (and allow Snakemake to initialise a conda environment in which to download and prepare these requirements), we make use of the `conda.yaml` file, which is set-up as follows:

```yaml
channels:
  - bioconda
dependencies:
  - pip:
      - numpy
      - pandas
```

This file states that in order for this rule to execute correctly, we need `pip` (the third-party package installer for python), as-well as several python packages installed through pip, namely `numpy` and `pandas` (note that Snakemake runs through Python so it must already be installed, although you can tag a specific version in the environment file if you wish, just be aware that this will increase the download size and setup time of the module). The current example could almost certainly be written in a more efficent way, but nevertheless provides an informative example.

When the `target` rule is run, a conda environment is set-up and launched. Then, the shell command is executed in that environment, and the environment is finally closed down once the command finishes executing. The output of the command is a file, written to `output(params("Source"))`, making use of the `output()` and `params()` grapevne wrappers to extract the 'Source' file-path and place it in the required output folder for the module. Note that there are a number of other ways in which this script could be written/called from Snakemake, but this is a simple example that demonstrates a number of basic principles.

The `Filter` module demonstrates the broad applicability and functionality of Snakemake. Finally, we note that in order to develop and test the module (outside of GRAPEVNE) it is useful to specify default values for the input and output namespaces (usually "in" and "out", respectively), as-well as providing a surrogate file to simulate incoming data (in this case as small `data.csv` file is placed in the `results/in` folder). These do not contribute during normal workflow execution.

### Aggregate By Month

The `AggregateByMonth` module follows the same pattern as the `Filter` module, except for the specifics of the script file and associated dependencies. To view these files, see the corresponding github folder: [AggregateByMonth](https://github.com/kraemer-lab/vneyard/tree/main/workflows/TutorialBuilder/modules/AggregateByMonth).

### Select

Likewise the `Select` module follows a similar pattern to both the `Filter` and `AggregateByMonth` modules, excepting the specifics of their implementation in the script file, and associated dependencies. To view these files, see the corresponding github folder: [Select](https://github.com/kraemer-lab/vneyard/tree/main/workflows/TutorialBuilder/modules/Select)

### Plot

The `Plot` module also follows a similar pattern to the above modules, but provides a graphical output. While we have (again) utilised `python` (and the `matplotlib` library in this case), we could have just as easily implemented these scripts in R (using packages such as `seabourne`), or made use of any other languages or packages as needed. We simply need to ensure that the correct dependencies are listed in the `conda.yaml` environment file.

For demonstration purposes, the contents of the `resources/scripts/plotcol.py` file are:

```python
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

The contents of the `conda.yaml` file is:

```yaml
channels:
  - bioconda
dependencies:
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
