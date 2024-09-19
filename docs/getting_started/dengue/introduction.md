# Introduction

This pipeline is designed for the retrieval, processing, subsampling, and phylogenetic analysis of the latest dengue virus sequences. It leverages Snakemake, a powerful workflow management system, to ensure reproducibility and efficiency in bioinformatics analyses.

## Pipeline

Here is an overview of the pipeline that we will construct. For simplicity (and due to the extended runtime of some software) we will implement the main pipeline in this tutorial, disregarding the `BEAST` branch.

![Dengue pipeline overview](images/dengue_pipeline.png)

## Step by step of the pipeline

The steps in the pipeline are as follows (see the [Dengue repository](https://github.com/rhysinward/dengue_pipeline) for more details):

1. Acquisition of Genomic Data and Metadata from GenBank
2. Clean metadata and FASTA files
3. Filter for sequences from SEA
4. Split into serotype, add serotypes to sequence name and generate sequence specific metadata
5. (Future step not currently implemented) Verifying Serotypes and Genotypes
6. Sequence alignment
7. Segregating E gene and Whole Genomes and performing quality control
8. Subsampler
9. Correct metadata and fasta files into the correct format for iqtree and treetime
10. ML-Treebuilding
11. Build time-calibrated trees
12. Infer "ancestral" mutations across the tree (nextstrain)
13. Translate sequences (nextstrain)
14. Discrete trait reconstruction (nextstrain)
15. Export for visualisation in Auspice (nextstrain)
16. Extract annotated tree from nextstrain JSON format
17. Extract information from tree
18. Quantify number of exports and imports from desired country
