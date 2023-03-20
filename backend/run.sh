#/usr/bin/env bash

set -euox pipefail

# Setup venv as needed
if [ ! -d "venv" ]; then
	python3 -m venv venv
	python3 -m pip install --upgrade pip
	python3 -m pip install -r requirements.txt
fi

. venv/bin/activate
flask --app app.py --debug run
