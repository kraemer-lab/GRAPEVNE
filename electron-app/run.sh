#!/usr/bin/env bash

# Launches the electron app

set -eoux pipefail

# activate virtual environment
if [ ! -d "venv" ]; then
	python3 -m venv venv
	python3 -m pip install --upgrade pip
	python3 -m pip install -r requirements.txt
fi
source venv/bin/activate

out/PhyloFlow-*/PhyloFlow.app/Contents/MacOS/PhyloFlow
