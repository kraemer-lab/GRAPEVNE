#!/usr/bin/env bash

# Builds and launches the electron app in production mode
#  - Business logic resides in Python, so this script launches the app
#    in a virtual environment to communicates with the relevant Python
#    packages
#  - Business logic should be ported from Python to nodejs to remove these
#    dependencies from the app

set -eoux pipefail

# clean distributables
rm -rf dist out

# compile build dependencies
./build_deps.sh

# compile GRAPEVNE
#rm -rf node_modules  # deep clean
yarn
yarn build
yarn package
