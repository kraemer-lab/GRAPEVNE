#!/usr/bin/env bash

set -euox pipefail
cd "$(dirname "$0")"

yarn
yarn lint
yarn madge
yarn test
