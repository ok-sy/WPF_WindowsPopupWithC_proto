#!/usr/bin/env bash

set -e

## 스크립트가 위치한 디렉토리 경로를 SCRIPT_DIR 변수에 할당합니다.
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "${SCRIPT_DIR}"

# local, dev, prod
PROFILE=$1

# zerorule/zero-rule-server:dev
IMG=$2

## PROFILE 또는 IMG 변수가 비어 있으면 사용 방법을 출력하고 종료합니다
if [ -z "${PROFILE}" -o -z "${IMG}" ];then
    echo "$0 <local,dev,prod> <docker-image-tag>"
	exit 1
fi

bash _build.sh "${PROFILE}"

cd app

## Docker 이미지를 빌드합니다. SPRING_PROFILES_ACTIVE 환경 변수를 Docker 빌드 인수로 전달합니다.
docker build . -f Dockerfile \
    -t "$IMG" \
    --build-arg SPRING_PROFILES_ACTIVE="${PROFILE}"

