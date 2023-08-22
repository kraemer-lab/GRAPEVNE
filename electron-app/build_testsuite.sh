#!/usr/bin/env bash

set -eoux pipefail

RUNNER_OS=${RUNNER_OS:-$(uname)}
PKG=$(ls ./out | grep GRAPEVNE)
if [[ "$RUNNER_OS" == "Windows" ]]; then
    ./out/${PKG}/GRAPEVNE.exe --self-test=true
elif [[ "$RUNNER_OS" == "Linux" ]]; then
    xvfb-run ./out/${PKG}/GRAPEVNE --self-test=true
elif [[ "$RUNNER_OS" == "macOS" || "$RUNNER_OS" == "Darwin" ]]; then
    ./out/${PKG}/GRAPEVNE.app/Contents/MacOS/GRAPEVNE --self-test=true
else
    echo "Unknown OS: $RUNNER_OS"
    exit 1
fi
