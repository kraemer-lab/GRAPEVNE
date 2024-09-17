#!/usr/bin/env bash

set -eoux pipefail

# Rebuild components
pushd ../builder/
uv build
popd
pushd ../runner/
uv build
popd

# setup and activate a virtual environment
uv venv
uv sync
RUNNER_OS=${RUNNER_OS:-$(uname)}
if [[ "$RUNNER_OS" == "Windows" ]]; then
    source ".venv\\Scripts\\activate"
else
    source .venv/bin/activate
fi
uv pip install --force-reinstall .

# compile python code to binary for deployment
uv run pyinstaller  \
    --name pyrunner \
    src/pyrunner/__main__.py \
    --hidden-import builder \
    --hidden-import runner \
    --hidden-import grapevne \
    --hidden-import grapevne.helpers \
    --hidden-import smart_open.ftp \
    --hidden-import smart_open.gcs \
    --hidden-import smart_open.hdfs \
    --hidden-import smart_open.http \
    --hidden-import smart_open.s3 \
    --hidden-import smart_open.ssh \
    --hidden-import smart_open.webhdfs \
    $(python collect_stdlibs.py) \
    --add-data "../builder/builder/sendmail.py:./builder/" \
    --add-data "src/pyrunner/Dockerfile:./pyrunner" \
    --add-data "src/pyrunner/build_container_sh:./pyrunner" \
    --add-data "src/pyrunner/launch_container_sh:./pyrunner" \
    --noconfirm

# Ensure nodemapper has the most up-to-date electron api file
cp src/api.ts ../nodemapper/src
cp src/types.ts ../nodemapper/src

# Prepare corepack / yarn
corepack enable
corepack prepare yarn@latest --activate
export COREPACK_ENABLE_NETWORK=true

# Build nodemapper (front-end)
pushd ../nodemapper
rm -rf dist
yarn install
yarn
yarn build
popd
