#!/usr/bin/env bash

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd ${SCRIPT_DIR}

prog=$0
tag=$1
DOCKER_FILE=$2

REGISTRY=hub.labcl.net
IMG=zerorule/zero-rule-web:${tag}

if [ -z "${DOCKER_FILE}" ];then
	DOCKER_FILE="Dockerfile"
fi

if [ -z "$tag" ]
then
    echo
    echo "Usage:"
    echo " $prog_nm <docker-image-tag> [Dockerfile]"
    echo "Example:"
    echo " $prog_nm dev"
    echo " $prog_nm prod Dockerfile-prod"
    echo " created docker image is 'zerorule/zero-rule-web:dev'"
    echo
    exit 1
fi

API_BASE_URL="${BUILD_ARG_API_BASE_URL}"
ROUTER_BASE_URL="${BUILD_ARG_ROUTER_BASE_URL}"
BASE_URL="${BUILD_ARG_BASE_URL}"

if [ -z "$API_BASE_URL" ]
then
    echo
    echo " environment variable BUILD_ARG_API_BASE_URL needed"
    exit 1
fi

export DOCKER_BUILDKIT=1

echo
echo "docker build . -f ${DOCKER_FILE}"
docker build . -f ${DOCKER_FILE} \
      -t "$IMG"  \
      --build-arg API_BASE_URL=${API_BASE_URL} \
      --build-arg BASE_URL=${BASE_URL} \
      --build-arg ROUTER_BASE_URL=${ROUTER_BASE_URL} 

echo
echo "docker tag $IMG ${REGISTRY}/${IMG}"
docker tag $IMG ${REGISTRY}/${IMG}

echo 'vqpbkkcGeix40JQLdMvGS5axDfw7CUYW' | docker login --password-stdin -u 'robot__harbor-bot' "${REGISTRY}"

echo
echo "docker push ${REGISTRY}/${IMG}"
docker push ${REGISTRY}/${IMG}



