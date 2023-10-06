FROM condaforge/mambaforge:23.3.1-1 as conda
FROM ubuntu:22.04 as base

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && \
    apt-get -y install \
      gcc=4:11.2.0-1ubuntu1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set-up conda
COPY --from=conda /opt/conda /opt/conda
ENV PATH="/opt/conda/bin:${PATH}"
RUN conda config --set channel_priority strict

# Install snakemake
RUN python -m pip install snakemake==7.32

# Copy workflow files to container
COPY . /workflow
WORKDIR /workflow

# Set-up the workflow conda environments
ENV TERM=xterm-color
RUN snakemake --conda-create-envs-only --use-conda --cores 1 $(snakemake --list)

# Run the workflow script
CMD ["bash", "-i", "-c", "./run.sh"]
