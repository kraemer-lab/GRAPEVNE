#!/usr/bin/env bash

rm -rf results
snakemake --cores 1 --use-conda --configfile=config/.test.yaml
