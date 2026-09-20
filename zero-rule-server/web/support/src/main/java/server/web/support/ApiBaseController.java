package server.web.support;

import cl.cloverframework.*;
import cl.cloverframework.api.CLApiResponse;
import cl.cloverframework.api.CLNewApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.ExceptionHandler;
import server.web.support.message.ICLMsgRepository;

import java.util.Objects;

public class ApiBaseController  {
    @Autowired
    protected ICLErrorResolver errorResolver;
    @Autowired
    protected ICLMsgRepository msgRepository;

    protected <T> CLApiResponse<T> successResult(T body) {
        return CLApiResponse.success(body);
    }

    protected CLApiResponse<Object> successResult() {
        return CLApiResponse.success();
    }

    protected <T> CLApiResponse<T> errorResult(ICLError error) {
        return CLApiResponse.error(error);
    }

    protected <T> CLApiResponse<T> errorResult(ICLErrorMeta error) {
        ICLError err = errorResolver.errorForMeta(error);
        return CLApiResponse.error(Objects.requireNonNull(err));
    }

    protected <T> CLApiResponse<T> errorResult(@NonNull String errorCode, @Nullable String message) {
        return CLApiResponse.error(errorCode, message);
    }

    @ExceptionHandler(CLException.class)
    protected CLApiResponse<?> handleApiException(CLException exception) {
        return errorResult(exception.getErrorCode(), exception.getMessage());
    }

    // msgerr - 2023.12 ssh 추가
    protected <T> CLNewApiResponse<T> resultMsg(@NonNull String msgId, T body) {

        ICLMsg msg = msgRepository.findByMsgId(msgId);
        if (msg == null) {
            String className = Thread.currentThread().getStackTrace()[2].getClassName();
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();
            return CLNewApiResponse.error(
                    new CLMsg("FW99999999", "존재하지 않는 메시지 코드입니다.", "ER","2")
                    , className,methodName,null);
        } else {
            if("ER".equals(msg.getMsgClsf())){


                String className = Thread.currentThread().getStackTrace()[3].getClassName();
                String methodName = Thread.currentThread().getStackTrace()[3].getMethodName();
                int lineNumber = Thread.currentThread().getStackTrace()[3].getLineNumber();
                return CLNewApiResponse.error(msg, className,methodName, body);
            } else {
                return CLNewApiResponse.success(msg, "","", body);
            }
        }
    }

    // msgerr - 2024.01 ssh 추가
    protected <T> CLNewApiResponse<T> resultMsg(@NonNull ICLMsg msg) {
        return resultMsg(msg.getMsgId(), null);
    }

    // msgerr - 2024.01 ssh 추가
    protected <T> CLNewApiResponse<T> resultMsg(@NonNull ICLMsg msg, T body) {
        return resultMsg(msg.getMsgId(), body);
    }

    // msgerr - 2023.12 ssh 추가
    protected <T> CLNewApiResponse<T> resultMsg(@NonNull String msgId) {
        return resultMsg(msgId, null);
    }

}

