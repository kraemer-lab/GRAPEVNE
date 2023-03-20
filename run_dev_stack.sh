#/usr/bin/env bash

set -euox pipefail

pushd backend
./run.sh &

popd
pushd nodemapper
./run.sh &
popd

