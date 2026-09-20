package server.setup;

import cl.cloverframework.log.CLUserState;
import jakarta.annotation.Nullable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import server.base.BuildVars;
import server.domain.entity.CLUser;
import server.repo.core.mapper.CLUserMapper;
import server.repo.core.mapper.SequenceMapper;

import java.time.Instant;

/**
 * 사용자 테이블 신규 생성
 * 초기 데이터 설정.
 * <p>기본으로 필요한 사용자와<br/>
 * 시스템에서 필요한 사용자 권한 등을 추가한다.
 * </p>
 */
@Component
@Slf4j
public class SetupDataInitializer2 implements
    ApplicationListener<ContextRefreshedEvent> {

    private boolean alreadySetup = false;

    @Autowired
    private CLUserMapper userMapper;

    @Autowired
    private SequenceMapper sequenceMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;


    /**
     * 스프링 ContextRefreshedEvent 수신.
     *
     * @param event the event to respond to
     */
    @Override
    @Transactional
    public void onApplicationEvent(ContextRefreshedEvent event) {
        if (alreadySetup) {
            log.debug("SetupDataInitializer already finished");
            return;
        }

        log.info("SetupDataInitializer started");
        createUserIfNotFound(
            BuildVars.MASTER_USER_ID,
            BuildVars.MASTER_LOGIN_ID,
            "마스터",
            "1111"
        );

        alreadySetup = true;
        log.info("SetupDataInitializer finished");
    }

    /**
     * 주어진 사용자가 없는 경우 사용자를 등록한다.
     *
     * @param lgonId         로그인ID
     * @param fixedUserId    고정 사용자 ID, null이면 자동생성
     * @param userName       사용자 이름
     * @param passwd         비밀번호
     */
    @Transactional
    public void createUserIfNotFound(
        @Nullable Long fixedUserId,
        String lgonId,
        String userName,
        String passwd
    ) {
        CLUser user = userMapper.findByLgonId(lgonId);
        if (user == null) {
            userMapper.insert(
                CLUser.builder()
                    .userId(fixedUserId == null ? sequenceMapper.nextAccountSeq() : fixedUserId)
                    .lgonId(lgonId)
                    .pswd (passwordEncoder.encode(passwd))
                    .userNm(userName)
                    .userState(CLUserState.ACTIVE)
                    .userGd("0")
                    .pswdInitYn("N")
                    .lastLgonDttm(null)
                    .regrId(null)
                    .chgrId(null)
                    .regDttm(Instant.now())
                    .chngDttm(Instant.now())
                    .build()
            );

            user = userMapper.findByLgonId(lgonId);
            if (user == null) {
                throw new RuntimeException("unexcepted exception, insert user fail maybe");
            }
        }

    }
}
