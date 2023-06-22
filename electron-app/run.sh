#!/usr/bin/env bash

# Launches the electron app in development mode
#  - Connects to frontend server running on localhost:5001
#  - The front-end can be configured to connect to nodejs (through electron),
#    or to communicate with a REST API running on localhost:5000
#  - Backend business logic resides in Python, so this script launches the app
#    in a virtual environment to communicates with the relevant Python
#    packages
#  - Business logic should be ported from Python to nodejs to remove these
#    dependencies from the app

set -eoux pipefail

# activate virtual environment
if [ ! -d "venv" ]; then
	python3 -m venv venv
	python3 -m pip install --upgrade pip
	python3 -m pip install -r requirements.txt
fi
source venv/bin/activate

# compile builderjs
pushd ../builderjs
yarn build
popd

# compile and run
yarn
yarn build
yarn start
