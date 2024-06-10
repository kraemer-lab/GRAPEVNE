#/usr/bin/env bash

set -euox pipefail

cd "$(dirname "$0")"
poetry install
source $(poetry env info --path)/bin/activate

poetry run ruff check builder
poetry run pytest

# mypy --strict builder
# mypy builder
