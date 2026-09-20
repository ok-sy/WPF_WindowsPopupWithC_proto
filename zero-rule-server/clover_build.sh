#!/usr/bin/env bash

set -e

# profile=dev,local,prod
profile=$1
DEPENDENCY="/home/diyadm/diysrc/zero-rule-server/app/build/dependency"
DIYAP="/home/diyadm/diyap"

##  profile 변수가 비어 있으면 사용 방법을 출력하고 종료합니다.
if [ -z "$profile" ];then
    echo
    echo "Usage:"
    echo "       $0 <local or dev or prod>"
    echo
    exit 1
fi

## 스크립트가 위치한 디렉토리 경로를 SCRIPT_DIR 변수에 할당합니다.
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")

## 스크립트가 위치한 디렉토리로 이동합니다.
cd "${SCRIPT_DIR}"

## Gradle을 사용하여 애플리케이션을 빌드합니다.
# ./gradlew -Dspring.profiles.active="${profile}" clean :app:build
./gradlew clean :app:build -Pprofile="${profile}"

mkdir -p ${DEPENDENCY}
cd ${DEPENDENCY}

## libs 디렉토리에 있는 JAR 파일을 app/build/dependency 디렉토리로 복사합니다.
for f in ../libs/*.jar;
do
  jar -xf "${f}"
done

mkdir -p ${DIYAP}/app/
mkdir -p ${DIYAP}/app/lib
mkdir -p ${DIYAP}/app/META-INF

cp -R ${DEPENDENCY}/BOOT-INF/lib/*     ${DIYAP}/app/lib
cp -R ${DEPENDENCY}/META-INF/*         ${DIYAP}/app/META-INF
cp -R ${DEPENDENCY}/BOOT-INF/classes/* ${DIYAP}/app/

