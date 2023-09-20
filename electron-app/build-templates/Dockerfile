FROM condaforge/mambaforge:latest as conda
FROM ubuntu:latest as base

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && \
    apt-get -y install gcc

# Set-up conda
COPY --from=conda /opt/conda /opt/conda
ENV PATH="/opt/conda/bin:${PATH}"
RUN conda config --set channel_priority strict

# Install snakemake
RUN python -m pip install snakemake

# Copy workflow files to container
COPY build .

# Set-up the workflow conda environments
RUN snakemake --conda-create-envs-only --use-conda --cores 1 $(snakemake --list)
ENV TERM=xterm-color

# Run the workflow script
CMD ["bash", "-i", "-c", "./run.sh"]
