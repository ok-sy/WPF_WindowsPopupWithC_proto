#!/usr/bin/env bash

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "${SCRIPT_DIR}"

# local, dev, prod
PROFILE=dev
REGISTRY=hub.labcl.net
IMG=zerorule/zero-rule-server:${PROFILE}

sh _build-docker.sh $PROFILE "${IMG}"

cd app
docker tag $IMG ${REGISTRY}/${IMG}

echo 'vqpbkkcGeix40JQLdMvGS5axDfw7CUYW' | docker login --password-stdin -u 'robot__harbor-bot' "${REGISTRY}"

echo
echo "docker push ${REGISTRY}/${IMG}"
docker push ${REGISTRY}/${IMG}
