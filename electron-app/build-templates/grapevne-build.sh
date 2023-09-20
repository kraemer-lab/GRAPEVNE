#!/usr/bin/env bash

docker build -t grapevne-build .

# -t = allocate a pseudo-TTY (passes syntax highlights from the terminal)
docker run -t grapevne-build
