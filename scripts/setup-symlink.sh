#!/bin/bash

# Location of the script
ME_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# assume we are in buildScripts
ROOT_DIR="$( dirname "$ME_DIR" )"

echo "Creating symlink for lib..."

cd ${ROOT_DIR}

# Remove existing directory if it exists
rm -rf src/lib

# Create the symlink
ln -s ../modules/lib/src src/lib
echo "Symlink created: src/lib -> ../modules/lib/src"

# Add src/lib to gitignore to avoid git confusion
echo "src/lib" >> .gitignore
