# Introduction

Here, we will walk through the translation of a pipeline for analysing the
global source-sink dynamics of variants of concern ('vocpl'). The original
analysis is available as a NEXTFLOW pipeline
[https://github.com/joetsui1994/vocpl](https://github.com/joetsui1994/vocpl),
though no NEXTFLOW knowledge is required to complete this walkthrough.

```{note}
In order to run the tutorial you will require access to `beta.fasta`,
available under controlled access through [GISAID](https://gisaid.org/).
```

Briefly, the vocpl workflow consists of the following steps:

1. Specify seeds
2. Subsample alignment
3. Genome alignment (nextalign)
4. Maximum Likelihood Tree estimation
5. Sequence reconstruction (treetime)
6. DTA.

```{graphviz}
:name: vocpl.workflow
:caption: vocpl workflow
:alt: alt
:align: center
digraph G {
    rankdir = LR;
    node [shape = box];

    n1 [label="Specify seeds"];
    n2 [label="Subsample alignment"];
    n3 [label="Genome alignment"];
    n4 [label="Tree estimation"];
    n5 [label="Sequence reconstruction"];
    n6 [label="DTA"];
    n1 -> n2 -> n3 -> n4 -> n5 -> n6
}
```

We will walk through the first few steps of this pipeline in detail, and then
provide links to the remaining modules for you to
view/edit, and to allow the pipeline to be completed.
