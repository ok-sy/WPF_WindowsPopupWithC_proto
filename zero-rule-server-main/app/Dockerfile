## Docker 이미지의 기본 이미지를 지정합니다. 이 경우, Alpine Linux에서 OpenJDK 11을 사용합니다.
# FROM openjdk:17-alpine 도커 Hub 에거 현재 사용 중지됬다고함.
FROM eclipse-temurin:17-jdk-alpine
## 이미지를 빌드할 때 root 사용자로 전환합니다.
USER root
## Spring 프로파일을 활성화하는 빌드 인수입니다. 기본값은 "local"입니다.
ARG SPRING_PROFILES_ACTIVE=local
## 타임존을 서울로 설정합니다.
RUN ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime

## BusyBox Extra 패키지를 설치합니다.
RUN apk --update --no-cache add busybox-extras

## 폰트 패키지를 설치합니다.
RUN apk add freetype ttf-dejavu

## 작업 디렉토리를 /project로 설정합니다.
WORKDIR /project

## 빌드 인수를 정의합니다.
## DEPENDENCY는 build/dependency로 설정됩니다.
ARG DEPENDENCY=build/dependency

## 빌드된 애플리케이션의 라이브러리를 /project/app/lib 디렉토리로 복사합니다.
COPY ${DEPENDENCY}/BOOT-INF/lib     /project/app/lib
COPY ${DEPENDENCY}/META-INF         /project/app/META-INF
COPY ${DEPENDENCY}/BOOT-INF/classes /project/app/

## Docker 컨테이너에서 애플리케이션을 실행하는 데 사용되는 스크립트를 복사합니다.
COPY ./run-in-docker.sh             /project/run-in-docker.sh

##  런타임 환경 변수를 설정합니다.
RUN echo "SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE}"  > /project/runtime-env

## Docker 컨테이너가 시작될 때 실행되는 명령을 지정합니다.
## run-in-docker.sh 스크립트를 실행합니다.
CMD ["sh", "/project/run-in-docker.sh"]
