#!/usr/bin/env bash

set -euox pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
pushd $SCRIPT_DIR

# Setup venv as needed
if [ ! -d "venv" ]; then
	python3 -m venv venv
	python3 -m pip install --upgrade pip
	python3 -m pip install -r requirements.txt
fi

. venv/bin/activate

# Ensure we are loading the latest local libraries
python -m pip install -e ../runner
python -m pip install -e ../builder
flask --app app.py --debug run

popd
