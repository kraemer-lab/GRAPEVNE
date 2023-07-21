#!/usr/bin/env bash

set -euox pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
pushd $SCRIPT_DIR

# Setup venv as needed
if [ ! -d "venv" ]; then
	python3 -m venv venv
    source venv/bin/activate
	python -m pip install --upgrade pip
	python-m pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Ensure we are loading the latest local libraries
python -m pip install -e ../runner
python -m pip install -e ../builder
python -m flask --app app.py --debug run

popd
