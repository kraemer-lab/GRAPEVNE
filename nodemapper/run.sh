#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
pushd "$SCRIPT_DIR"

cp src/redux/globals_rest.ts src/redux/globals.ts

yarn
yarn build

yarn start
popd
