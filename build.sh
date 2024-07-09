#!/usr/bin/env bash

set -euxo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

pushd "$SCRIPT_DIR"
cd "$SCRIPT_DIR"/electron-app
./build.sh
popd

echo "The application can be found in ./electron-app/out/ for your platform."
