#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
pushd $SCRIPT_DIR

yarn

# Check dockerfile for explanation of this bit
if [ ! -d "react-diagrams" ]; then
	git clone https://github.com/projectstorm/react-diagrams.git
fi
cp -r react-diagrams/packages/* node_modules/@projectstorm/

yarn start
popd
