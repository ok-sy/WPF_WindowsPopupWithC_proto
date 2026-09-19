#!/bin/bash

pid=$(ps -ef|grep -v grep|grep diyadm|grep server.app.App| awk '{print $2}')


if [ -z ${pid} ];then
        echo "clover is not running"
else
        echo "stop clover pid = ${pid}"
        kill -15 ${pid}
fi
