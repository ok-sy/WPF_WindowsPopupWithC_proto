package server.task;

import cl.cloverframework.task.CLJobInterval;
import cl.cloverframework.task.ICLJob;
import cl.cloverframework.task.ICLJobMetadata;
import cl.cloverframework.task.impl.CLJobMetadata;
import org.springframework.lang.NonNull;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static cl.cloverframework.task.CLJobInterval.*;

public class JobMetadatas {
    public static Map<String, ICLJobMetadata> generate() {
        List<ICLJobMetadata> list = Arrays.asList(
            c(HelloWorldJob.class, HOUR_4, "Hello world", "4시간에 한번 실행"),
            c(OldDataCleanJob.class, HOUR_1, "오래된 데이터 삭제", "1시간에 한번 실행"),
            c(OldFileRemoveJob.class, HOUR_1, "삭제 마킹된 파일 삭제", "2시간에 한번 실행"),
            c(OldLognFailDataCleanJob.class, HOUR_1, "오래된 로그인 실패 삭제", "1시간에 한번실행")
        //TODO:: 추후에 3개월정도로 변경예정
//            c(OldLognPswdResetJob.class, DAY_1, "오래된 로그인 비밀번호 초기화", "3개월에 한번 실행으로 변경")
        );
        return list.stream().collect(Collectors.toMap(ICLJobMetadata::getJobId, Function.identity()));
    }


    /**
     * Job metadata 생성
     * 짧게 하려고 이름이 c
     *
     * @param clazz          Job 클래스
     * @param jobInterval    Job 실행간격
     * @param jobTitle       Job 제목
     * @param jobDescription Job 설명
     * @return JobConfig 객체
     */
    private static ICLJobMetadata c(
        @NonNull Class<? extends ICLJob> clazz,
        @NonNull CLJobInterval jobInterval,
        @NonNull String jobTitle,
        @NonNull String jobDescription
    ) {
        return new CLJobMetadata(clazz.getSimpleName(), jobInterval, jobTitle, jobDescription);
    }
}
