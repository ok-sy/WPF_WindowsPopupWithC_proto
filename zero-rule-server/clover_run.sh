#!/bin/bash

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "${SCRIPT_DIR}"

# export GOOGLE_APPLICATION_CREDENTIALS="/project/google-service-account.json"

#cd /project
cd /home/diyadm/diyap/

[ -r "./runtime-env" ] && . ./runtime-env

  SPRING_PROFILES_ACTIVE=dev

echo "##############"
echo "start with profile: ${SPRING_PROFILES_ACTIVE}"


# maybe bug
# -Dspring.config.location='classpath:/,optional:file:./config/' \

nohup java -cp app:app/lib/* \
     -Dfile.encoding=UTF-8 \
     -Dsun.jnu.encoding=UTF-8 \
     -Dlog4j2.formatMsgNoLookups=true \
     -Djava.net.preferIPv4Stack=true \
     -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} \
     -Dspring.config.location='file:/home/diyadm/diyap/app/,optional:file:/home/diyadm/diyap/config/' \
     server.app.App > ./log/clover.nohup 2>&1 &
