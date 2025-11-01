#!/usr/bin/env bash

set -eoux pipefail

# Bundle miniforge
# if [[ "$RUNNER_OS" == "Windows" ]]; then
    echo "Downloading Miniforge for Windows..."
    # curl does not work on git-bash, so use the activated python environment
    source ".venv\\Scripts\\activate"
    uv venv --clear --python 3.13
    source .venv/Scripts/activate
    uv pip install requests
    python -c "import requests; open('Miniforge3-Windows-x86_64.exe', 'wb').write(requests.get('https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Windows-x86_64.exe', allow_redirects=True).content)"
    powershell.exe -Command 'Start-Process .\Miniforge3-Windows-x86_64.exe -ArgumentList "/S /NoRegistry=1 /D=$env:UserProfile\miniforge3" -Wait'
    export CONDA_PATH="${USERPROFILE}"/miniforge3/condabin
    echo "done."
# elif [[ "$RUNNER_OS" == "Linux" ]]; then
#     echo "Downloading Miniforge for Linux..."
#     wget -O Miniforge3.sh "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
#     bash Miniforge3.sh -b
#     export CONDA_PATH="${HOME}"/miniforge3/bin
#     echo "done."
# elif [[ "$RUNNER_OS" == "macOS" || "$RUNNER_OS" == "Darwin" ]]; then
#     # Check for existing installation (will only be present on developer machines)
#     echo "Downloading Miniforge for macOS..."
#     if [ -f "Miniforge3.sh" ]; then
#         echo "Miniforge3.sh already exists, skipping download."
#     else
#         curl -fsSLo Miniforge3.sh "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-MacOSX-$(uname -m).sh"
#     fi
#     bash Miniforge3.sh -b
#     export CONDA_PATH="${HOME}"/miniforge3/bin
#     echo "done."
# else
#     echo "Unknown OS: $RUNNER_OS"
#     exit 1
# fi
