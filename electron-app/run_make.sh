#!/usr/bin/env bash

set -eoux pipefail

# Ensure nodemapper up-to-date
pushd ../nodemapper
yarn
yarn build
popd

# compile builderjs
pushd ../builderjs
yarn build
popd

# compile PhyloFlow
yarn
yarn build
yarn make

# Run the app
out/PhyloFlow-darwin-arm64/PhyloFlow.app/Contents/MacOS/PhyloFlow
