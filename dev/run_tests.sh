#/usr/share/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
pushd `$SCRIPT_DIR/..`

pushd backend
./run_tests.sh
popd

pushd builder
./run_tests.sh
popd

pushd runner
./run_tests.sh
popd

pushd nodemapper
./run_tests.sh
popd

# Return to calling directory
popd
