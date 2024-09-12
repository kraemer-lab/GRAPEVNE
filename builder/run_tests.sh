#/usr/bin/env bash

set -euox pipefail

cd "$(dirname "$0")"
uv venv
uv sync
source .venv/bin/activate
uv pip install .

uv run ruff check builder
uv run pytest

# uv run mypy --strict builder
# uv run mypy builder
