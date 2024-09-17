import sys

import snakemake
from pyrunner import pyrunner


if len(sys.argv) > 2:
    # PyInstaller redirects sys.executable to this file as the entry point.
    # Redirecting sys.executable may be possible by bundling the python binary, but
    # here we just call the snakemake.cli.main function directly.
    snakemake.cli.main(" ".join(sys.argv[3:]))
else:
    pyrunner.main(sys.argv[1])
