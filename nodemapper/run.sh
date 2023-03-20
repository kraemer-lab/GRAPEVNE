#!/usr/bin/env bash

yarn

# Check dockerfile for explanation of this bit
if [ ! -d "react-diagrams" ]; then
	git clone https://github.com/projectstorm/react-diagrams.git
fi
cp -r react-diagrams/packages/* node_modules/@projectstorm/

yarn start
