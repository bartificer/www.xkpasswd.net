#!/bin/bash

# Location of the script
ME_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# assume we are in scripts
ROOT_DIR="$( dirname "$ME_DIR" )"

mkdir -p ${ROOT_DIR}/modules  # Ensure the modules directory exists

# Add the lib submodule in modules/
git submodule add https://github.com/bartificer/xkpasswd-js.git modules/lib
git submodule update --init --recursive
