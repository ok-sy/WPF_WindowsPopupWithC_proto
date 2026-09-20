#!/usr/bin/env bash

## 스크립트에서 오류가 발생하면 즉시 종료하도록 지정합니다.
set -e

## 스크립트가 위치한 디렉토리를 찾습니다.
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")

##  스크립트가 위치한 디렉토리로 이동합니다.
cd "${SCRIPT_DIR}"

# export GOOGLE_APPLICATION_CREDENTIALS="/project/google-service-account.json"

## 작업 디렉토리를 /project로 변경합니다.
cd /project

## runtime-env파일을 읽어서 환경 변수를 설정합니다.
[ -r "./runtime-env" ] && . ./runtime-env

## Spring 프로파일이 지정되지 않은 경우 기본값으로 dev를 사용합니다.
if [ -z "${SPRING_PROFILES_ACTIVE}" ];then
  SPRING_PROFILES_ACTIVE=dev
  echo "no custom profile settings"
fi

## 현재 사용 중인 Spring 프로파일을 출력합니다.
echo "##############"
echo "start with profile: ${SPRING_PROFILES_ACTIVE}"


# maybe bug
# -Dspring.config.location='classpath:/,optional:file:./config/' \

## java -cp app:app/lib/* \
## 애플리케이션을 실행하는 Java 명령입니다. 클래스 경로는 app 및 app/lib 디렉토리입니다.
## -Dfile.encoding=UTF-8 \
## 파일 인코딩을 UTF-8로 설정합니다.
##-Dsun.jnu.encoding=UTF-8 \
## JNU 인코딩을 UTF-8로 설정합니다.
##-Dlog4j2.formatMsgNoLookups=true \
## Log4j2 메시지를 빠르게 출력하도록 설정합니다.
##-Djava.net.preferIPv4Stack=true \
## IPv4 스택을 사용하도록 설정합니다.
## -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} \
## Spring 프로파일을 활성화합니다.
## -Dspring.config.location='file:/project/app/,optional:file:/project/config/' \
## Spring 구성 파일의 위치를 지정합니다.
## server.app.App
## 이것은 실행할 메인 클래스입니다.

java -cp app:app/lib/* \
     -Dfile.encoding=UTF-8 \
     -Dsun.jnu.encoding=UTF-8 \
     -Dlog4j2.formatMsgNoLookups=true \
     -Djava.net.preferIPv4Stack=true \
     -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} \
     -Dspring.config.location='file:/project/app/,optional:file:/project/config/' \
     server.app.App

