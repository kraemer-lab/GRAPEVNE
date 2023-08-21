#!/usr/bin/env bash

set -eoux pipefail

# activate virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
RUNNER_OS=${RUNNER_OS:-$(uname)}
if [[ "$RUNNER_OS" == "Windows" ]]; then
    venv/Scripts/Activate.bat
else
    source venv/bin/activate
fi
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install ../builder
python -m pip install ../runner

# compile python code to binary for deployment
python -m pip install pyinstaller
python -m PyInstaller src/python/backend.py \
    --onefile \
    --hidden-import builder \
    --hidden-import runner \
    --hidden-import smart_open.ftp \
    --hidden-import smart_open.gcs \
    --hidden-import smart_open.hdfs \
    --hidden-import smart_open.http \
    --hidden-import smart_open.s3 \
    --hidden-import smart_open.ssh \
    --hidden-import smart_open.webhdfs

# Ensure nodemapper up-to-date
pushd ../nodemapper
cp src/redux/globals_electron.ts src/redux/globals.ts
yarn
yarn build
popd

# Bundle Mambaforge
if [[ "$RUNNER_OS" == "Windows" ]]; then
    echo "Downloading Mambaforge for Windows..."
    curl.exe -o "Mambaforge-Windows-x86_64.exe" "https://github.com/conda-forge/miniforge/releases/latest/download/Mambaforge-Windows-x86_64.exe"
    start /wait "" Mambaforge-Windows-x86_64.exe /InstallationType=JustMe /RegisterPython=0 /S /D=%UserProfile%\Mambaforge
    echo "done."
elif [[ "$RUNNER_OS" == "Linux" ]]; then
    echo "Downloading Mambaforge for Linux..."
    wget -O Mambaforge.sh "https://github.com/conda-forge/miniforge/releases/latest/download/Mambaforge-$(uname)-$(uname -m).sh"
    bash Mambaforge.sh -b -p "./dist/conda"
    echo "done."
elif [[ "$RUNNER_OS" == "macOS" || "$RUNNER_OS" == "Darwin" ]]; then
    # Check for existing installation (will only present on developer machines)
    echo "Downloading Mambaforge for macOS..."
    if [ -f "Mambaforge.sh" ]; then
        echo "Mambaforge.sh already exists, skipping download."
    else
        curl -fsSLo Mambaforge.sh "https://github.com/conda-forge/miniforge/releases/latest/download/Mambaforge-MacOSX-$(uname -m).sh"
    fi
    if [ -d "./dist/conda" ]; then
        echo "Conda environment already exists, skipping installation."
    else
        bash Mambaforge.sh -b -p "./dist/conda"
    fi
    echo "done."
else
    echo "Unknown OS: $RUNNER_OS"
    exit 1
fi
