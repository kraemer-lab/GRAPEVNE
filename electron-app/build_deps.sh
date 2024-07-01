#!/usr/bin/env bash

set -eoux pipefail

# Rebuild components
pushd ../builder/
poetry build
popd
pushd ../runner/
poetry build
popd

# setup and activate a virtual environment
poetry env remove --all  # remove any existing virtual environment
poetry install --no-root  # use poetry to install dependencies
RUNNER_OS=${RUNNER_OS:-$(uname)}
if [[ "$RUNNER_OS" == "Windows" ]]; then
    source "$(poetry env info --path)\\Scripts\\activate"
else
    source $(poetry env info --path)/bin/activate
fi

# compile python code to binary for deployment
python -m PyInstaller src/python/pyrunner.py \
    --hidden-import builder \
    --hidden-import runner \
    --hidden-import smart_open.ftp \
    --hidden-import smart_open.gcs \
    --hidden-import smart_open.hdfs \
    --hidden-import smart_open.http \
    --hidden-import smart_open.s3 \
    --hidden-import smart_open.ssh \
    --hidden-import smart_open.webhdfs \
    $(python collect_stdlibs.py) \
    --add-data "src/python/Dockerfile:." \
    --add-data "src/python/build_container_sh:." \
    --add-data "src/python/launch_container_sh:."

# Ensure nodemapper has the most up-to-date electron api file
cp src/api.ts ../nodemapper/src
cp src/types.ts ../nodemapper/src

# Build nodemapper (front-end)
pushd ../nodemapper
rm -rf dist
yarn install
yarn
yarn build
popd
