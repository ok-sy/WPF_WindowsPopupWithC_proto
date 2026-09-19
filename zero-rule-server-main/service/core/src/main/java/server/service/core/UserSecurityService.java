package server.service.core;

import cl.cloverframework.impl.code.CLLoginFailReason;
import cl.cloverframework.impl.domain.entity.CLUserLgonBlockedIp;
import cl.cloverframework.impl.domain.entity.CLUserLgonFail;
import cl.cloverframework.impl.repo.CLUserLgonFailMapper;
import cl.cloverframework.impl.repo.CLUserLoginBlockedIpMapper;
import cl.cloverframework.impl.sql.ParamsUserLgonFail;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.base.logger.IAuditLogger;

import java.time.Instant;
import java.time.ZonedDateTime;

@Service
@Transactional
public class UserSecurityService {

    @Autowired
    CLUserLoginBlockedIpMapper userLoginBlockedIpMapper;

    @Autowired
    CLUserLgonFailMapper userLgonFailMapper;


    /**
     * Audit 로거
     */
    @Autowired
    private IAuditLogger auditLogger;


    /**
     * 로그인이 차단된 IP 인지 체크
     *
     * @param ip 체크할 IP 주소
     * @return 차단이면 true
     */
    public boolean isLoginBlockedIp(@NonNull String ip) {
        return userLoginBlockedIpMapper.existsNotExpiredByIp(ip);
    }

    /**
     * 사용자 로그인 실패 저장
     *
     * @param failId 실패 ID
     * @param lgonId 로그인 ID
     * @param reason 실패 이유
     * @param ip     사용자 IP 주소
     */
    @Transactional
    public void saveLoginFail(
        long failId,
        @NonNull String lgonId,
        @NonNull CLLoginFailReason reason,
        @NonNull String ip
    ) {
        // 사용자 로그인 실패 저장
        userLgonFailMapper.insert(
            CLUserLgonFail.builder()
                .failId(failId)
                .reason(reason)
                .regDttm(Instant.now())
                .ip(ip)
                .lgonId(lgonId)
                .build()
        );

        // 10분 동안 5+1회 로그인이 실패하면, 60분동안 IP 주소를 차단한다.

        // TODO HARDCODING
        Instant minRegDttm = ZonedDateTime.now().minusMinutes(10).toInstant();
        long failCount = userLgonFailMapper.countByIpAndRegDttmAfter(
            ParamsUserLgonFail.CountByIpAndRegDttmAfter.builder()
                .ip(ip)
                .regDttm(minRegDttm)
                .build()
        );

        if (failCount > 5) {
            Instant expiryDttm = ZonedDateTime.now().plusMinutes(60).toInstant();
            userLoginBlockedIpMapper.insert(
                CLUserLgonBlockedIp.builder()
                    .ip(ip)
                    .expiryDttm(expiryDttm)
                    .regDttm(Instant.now())
                    .build()
            );
            // 로그: 로그인 IP 주소를 n 시간동안 차단합니다.
            auditLogger.startLoginIpBlocked(ip, expiryDttm);
        }
    }

    /**
     * 로그인 실패 건수 조회 by ip and min regDttm
     * regDttm 이후의 로그인 실패 건수
     *
     * @param ip         IP 주소
     * @param minRegDttm 등록일시 기준값
     * @return 로그인 실패 건수
     */
    public long countLoginFailByIpAndRegDttmAfter(String ip, Instant minRegDttm) {
        return userLgonFailMapper.countByIpAndRegDttmAfter(
            ParamsUserLgonFail.CountByIpAndRegDttmAfter.builder()
                .ip(ip)
                .regDttm(minRegDttm)
                .build()
        );
    }
}
