#!/usr/bin/env bash

set -eoux pipefail

# compile builderjs
pushd ../builderjs
yarn build
popd

# compile and run
yarn
yarn build
yarn start
