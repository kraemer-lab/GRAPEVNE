#!/usr/bin/env bash

set -euox pipefail
cd "$(dirname "$0")"

corepack enable

yarn
yarn lint
yarn test
