#!/usr/bin/env bash

set -eoux pipefail

skip_containers=false
while getopts "s" opt; do
    case $opt in
        s) skip_containers=true
        ;;
        \?) echo "Invalid option -$OPTARG" >&2
        ;;
    esac
done

RUNNER_OS=${RUNNER_OS:-$(uname)}

# install miniforge if not already installed
if ! command -v mamba &> /dev/null
then
    source ./install_miniforge.sh
fi

# launch GRAPEVNE in the background and in debug mode
PKG=$(ls ./out | grep GRAPEVNE)
if [[ "$RUNNER_OS" == "Windows" ]]; then
    #echo "Migrating folder to C drive (due to issues running conda cross-drive)"
    cd ..
    cp -r electron-app /c/Users/runneradmin
    cd /c/Users/runneradmin/electron-app
    echo "Launching GRAPEVNE in the background and in debug mode"
    DOWNLOADPATH="${PWD}/postbuild_tests/downloads"
    echo "$DOWNLOADPATH"

# Minimise gitbash to pass focus to GRAPEVNE (required for tests to pass
# on Windows). powershell command must *not* be indented with whitespace.
powershell -Command "
  Add-Type @'
  using System;
  using System.Runtime.InteropServices;
  public class Win32 {
    [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow();
    [DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  }
'@
  \$hwnd = [Win32]::GetForegroundWindow();
  [Win32]::ShowWindow(\$hwnd, 6)  # 6 = Minimize
"

    ./out/"${PKG}"/GRAPEVNE.exe --args --remote-debugging-port=9515 --downloadpath="${DOWNLOADPATH}" --fullscreen --no-sandbox &
elif [[ "$RUNNER_OS" == "Linux" ]]; then
    export DISPLAY=:99
    Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
    DOWNLOADPATH="${PWD}/postbuild_tests/downloads"
    ./out/"${PKG}"/GRAPEVNE --args --remote-debugging-port=9515 --downloadpath="${DOWNLOADPATH}" --fullscreen --no-sandbox &
elif [[ "$RUNNER_OS" == "macOS" || "$RUNNER_OS" == "Darwin" ]]; then
    DOWNLOADPATH="${PWD}/postbuild_tests/downloads"
    ./out/"${PKG}"/GRAPEVNE.app/Contents/MacOS/GRAPEVNE --args --remote-debugging-port=9515 --downloadpath="${DOWNLOADPATH}" --fullscreen --no-sandbox &
else
    echo "Unknown OS: $RUNNER_OS"
    exit 1
fi

# run tests (which also closes GRAPEVNE)
if $skip_containers; then
    echo "Skipping container tests"
    yarn run postbuild-tests-no-containers
else
    yarn run postbuild-tests
fi
