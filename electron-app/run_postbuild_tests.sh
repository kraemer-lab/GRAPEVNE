#!/usr/bin/env bash

set -eoux pipefail

RUNNER_OS=${RUNNER_OS:-$(uname)}

# install mambaforge if not already installed
if ! command -v mamba &> /dev/null
then
    . ./install_mambaforge.sh
fi

# launch GRAPEVNE in the background and in debug mode
PKG=$(ls ./out | grep GRAPEVNE)
if [[ "$RUNNER_OS" == "Windows" ]]; then
    echo "Migrating folder to C drive (due to issues running conda cross-drive)"
    cd ..
    cp -r electron-app /c/Users/runneradmin
    cd /c/Users/runneradmin/electron-app
    echo "Launching GRAPEVNE in the background and in debug mode"
    DOWNLOADPATH="${PWD}/postbuild_tests/downloads"
    echo "$DOWNLOADPATH"
    ./out/"${PKG}"/GRAPEVNE.exe --args --remote-debugging-port=9515 --downloadpath="${DOWNLOADPATH}" &
elif [[ "$RUNNER_OS" == "Linux" ]]; then
    export DISPLAY=:99
    Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
    DOWNLOADPATH="${PWD}/postbuild_tests/downloads"
    ./out/"${PKG}"/GRAPEVNE --args --remote-debugging-port=9515 --downloadpath="${DOWNLOADPATH}" &
elif [[ "$RUNNER_OS" == "macOS" || "$RUNNER_OS" == "Darwin" ]]; then
    DOWNLOADPATH="${PWD}/postbuild_tests/downloads"
    ./out/"${PKG}"/GRAPEVNE.app/Contents/MacOS/GRAPEVNE --args --remote-debugging-port=9515 --downloadpath="${DOWNLOADPATH}" &
else
    echo "Unknown OS: $RUNNER_OS"
    exit 1
fi

# run tests (which also closes GRAPEVNE)
yarn run postbuild-tests
