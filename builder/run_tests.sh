#/usr/bin/env bash

set -euox

cd "$(dirname "$0")"
uv sync
source .venv/bin/activate || source ".venv\\Scripts\\activate" || true
uv pip install .

uv run ruff check builder
uv run pytest

# uv run mypy --strict builder
# uv run mypy builder
