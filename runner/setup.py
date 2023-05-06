#!/usr/bin/env python
from setuptools import setup


setup(
    name="runner",
    version="0.1",
    description="phyloflow runner",
    packages=["runner", "runner.snakemake_runner"],
    zip_safe=False,
)
