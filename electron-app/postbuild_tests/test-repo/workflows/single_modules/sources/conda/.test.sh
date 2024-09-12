#!/usr/bin/env bash

rm -rf results/out
snakemake --cores 1 --use-conda --configfile=config/.test.yaml _test
