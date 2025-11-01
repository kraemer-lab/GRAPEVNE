#/usr/bin/env bash

set -euox

cd "$(dirname "$0")"
uv sync
source .venv/bin/activate & source ".venv\\Scripts\\activate"
uv pip install .
uv pip install -e ../builder

uv run ruff check runner
uv run pytest

# uv run mypy --strict runner
# uv run mypy runner
