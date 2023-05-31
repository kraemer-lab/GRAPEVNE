#/usr/bin/env bash

set -euox pipefail

cd "$(dirname "$0")"
source venv/bin/activate

flake8
pytest
