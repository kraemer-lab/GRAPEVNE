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
python -m PyInstaller src/python/pyrunner.py \
    --hidden-import builder \
    --hidden-import runner \
    --hidden-import smart_open.ftp \
    --hidden-import smart_open.gcs \
    --hidden-import smart_open.hdfs \
    --hidden-import smart_open.http \
    --hidden-import smart_open.s3 \
    --hidden-import smart_open.ssh \
    --hidden-import smart_open.webhdfs

# Check for presence of yarn
if ! command -v yarn &> /dev/null
then
    npm i yarn
    alias yarn="${PWD}/node_modules/.bin/yarn"
fi
if ! command -v yarn &> /dev/null
then
    echo "yarn could not be found or installed."
    exit
fi

# Ensure nodemapper has the most up-to-date electron api file
cp src/api.ts ../nodemapper/src

# Build nodemapper (front-end)
pushd ../nodemapper
cp src/redux/globals_electron.ts src/redux/globals.ts
yarn
yarn build
popd
