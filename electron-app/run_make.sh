#!/usr/bin/env bash

set -eoux pipefail

# Ensure nodemapper up-to-date
pushd ../nodemapper
yarn
yarn build
popd

yarn
yarn make

# Run the app
out/PhyloFlow-darwin-arm64/PhyloFlow.app/Contents/MacOS/PhyloFlow
