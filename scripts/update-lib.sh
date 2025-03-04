#!/bin/bash

# Location of the script
ME_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# assume we are in buildScripts
ROOT_DIR="$( dirname "$ME_DIR" )"

echo "Updating lib submodule..."

cd ${ROOT_DIR}/modules/lib
git checkout main
git pull origin main
cd -

# Check if symlink exists, only recreate if missing
if [ ! -L src/lib ]; then
  # echo "Symlink missing! Recreating..."
  ln -s ../modules/lib/src src/lib
fi

echo "Update complete!"
