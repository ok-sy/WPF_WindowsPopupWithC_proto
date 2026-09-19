#!/usr/bin/env bash

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "${SCRIPT_DIR}"

rm -rf main/node_modules main/.next main/.turbo main/build

for f in sub/*; do
    echo "rm -rf $f/node_modules $f/.turbo $f/build $f/dist"
    rm -rf $f/node_modules $f/.turbo $f/build $f/dist
done

echo "$(pwd) : rm -rf node_modules .turbo"
rm -rf node_modules .turbo
