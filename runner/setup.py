#!/usr/bin/env python
from setuptools import setup


setup(
    name="runner",
    version="0.1",
    description="GRAPEVNE runner",
    packages=["runner", "runner.snakemake_runner"],
    zip_safe=False,
)
