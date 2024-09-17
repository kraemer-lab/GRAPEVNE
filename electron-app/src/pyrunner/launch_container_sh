#!/usr/bin/env bash

# Halt upon error
set -eoux pipefail
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Provide a name for the container here
NAME="grapevne-build"

# Ensure mounted directories exist before mount (consistent permissions in the container)
mkdir -p "${SCRIPT_DIR}"/results
mkdir -p "${SCRIPT_DIR}"/benchmark
mkdir -p "${SCRIPT_DIR}"/logs

# Launch image
docker run \
    --platform linux/amd64 \
    -v "${SCRIPT_DIR}"/results:/home/user/results \
    -v "${SCRIPT_DIR}"/benchmark:/home/user/benchmark \
    -v "${SCRIPT_DIR}"/benchmark:/home/user/logs \
    "${NAME}"
