#!/usr/bin/env bash

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "${SCRIPT_DIR}"

# export BUILD_ARG_API_BASE_URL=https://zerorule.labcl.net/zero-rule-server
export BUILD_ARG_API_BASE_URL=http://192.168.114.71:4018/zero-rule-server
export BUILD_ARG_ROUTER_BASE_URL=/
export BUILD_ARG_BASE_URL=https://zerorule.labcl.net

export NODE_ENV=production

./_build-docker.sh dev

/app/services/zerorule/zero-rule-web/up.sh

