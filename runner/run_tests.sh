#/usr/bin/env bash

set -euox pipefail

cd "$(dirname "$0")"
uv sync
source .venv/bin/activate
uv pip install .

uv run ruff check runner
uv run pytest

# uv run mypy --strict runner
# uv run mypy runner
