#!/usr/bin/env bash

set -euox pipefail
cd "$(dirname "$0")"

# Python backend tests
uv venv
uv sync
RUNNER_OS=${RUNNER_OS:-$(uname)}
if [[ "$RUNNER_OS" == "Windows" ]]; then
    source ".venv\\Scripts\\activate"
else
    source .venv/bin/activate
fi
uv pip install --force-reinstall .
uv run pytest
deactivate

# pyrunner (PyInstaller compiled tests)
dist/pyrunner/pyrunner --cores 1 --version  # bundled snakemake version

# Node tests
corepack enable
yarn
yarn lint
yarn test
