#!/usr/bin/env bash

yarn

# Check dockerfile for explanation of this bit
if [ ! -d "react-diagrams" ]; then
	git clone https://github.com/projectstorm/react-diagrams.git
fi
cp -r react-diagrams/packages/* node_modules/@projectstorm/

# Required to disambiguate during testing
mv react-diagrams/packages/react-diagrams/package.json react-diagrams/packages/react-diagrams/package.json.jsb

yarn lint
yarn test

# Revert
mv react-diagrams/packages/react-diagrams/package.json.jsb react-diagrams/packages/react-diagrams/package.json
