#/usr/bin/env bash

set -euox pipefail

cd "$(dirname "$0")"
if [ -d "venv" ]; then
    source venv/bin/activate
else
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

flake8
pytest

# mypy --strict builder
# mypy builder
