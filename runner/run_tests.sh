#/usr/bin/env bash

set -euox pipefail

cd "$(dirname "$0")"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt

python -m flake8
python -m pytest

# mypy --strict runner
# mypy runner
