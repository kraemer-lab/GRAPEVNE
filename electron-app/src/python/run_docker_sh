#!/usr/bin/env bash

# Halt upon error
set -eoux pipefail
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Provide a name for the container here
NAME="grapevne-build"

# Construct image
docker build \
    --build-arg HOST_UID=$(id -u) \
    -t "${NAME}" \
    "${SCRIPT_DIR}"

# Ensure mounted directories exist before mount (consistent permissions in the container)
mkdir -p "${SCRIPT_DIR}"/results
mkdir -p "${SCRIPT_DIR}"/benchmark

# Launch image
docker run \
    -v "${SCRIPT_DIR}"/results:/home/user/workflow/results \
    -v "${SCRIPT_DIR}"/benchmark:/home/user/workflow/benchmark \
    "${NAME}"
