#!/usr/bin/env bash

set -eoux pipefail

# launch GRAPEVNE in the background and in debug mode
RUNNER_OS=${RUNNER_OS:-$(uname)}
PKG=$(ls ./out | grep GRAPEVNE)
if [[ "$RUNNER_OS" == "Windows" ]]; then
    echo "Launching GRAPEVNE in the background and in debug mode"
    ./out/"${PKG}"/GRAPEVNE.exe --args --remote-debugging-port=9515 &
elif [[ "$RUNNER_OS" == "Linux" ]]; then
    export DISPLAY=:99
    Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
    ./out/"${PKG}"/GRAPEVNE --args --remote-debugging-port=9515 &
elif [[ "$RUNNER_OS" == "macOS" || "$RUNNER_OS" == "Darwin" ]]; then
    ./out/"${PKG}"/GRAPEVNE.app/Contents/MacOS/GRAPEVNE --args --remote-debugging-port=9515 &
else
    echo "Unknown OS: $RUNNER_OS"
    exit 1
fi

# run tests (which also closes GRAPEVNE)
yarn run postbuild-tests
