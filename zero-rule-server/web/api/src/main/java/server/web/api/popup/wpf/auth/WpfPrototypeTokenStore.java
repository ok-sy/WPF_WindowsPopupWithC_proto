package server.web.api.popup.wpf.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import server.base.props.WpfAuthPrototypeProps;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 프로토타입 WPF 토큰의 서버 메모리 저장소.
 *
 * <p>[추가 이유 — 설계 10 §6.2] WPF가 {@code 401 → 재로그인 → 원 요청 재전송}을 검증하려면 서버가 "발급한 토큰의
 * 존재 여부"와 "만료 시각"만은 실제로 검사해야 한다. 그 최소 상태를 DB 없이 JVM 메모리에 둔다.
 * 서버 재시작 시 모두 사라지며(설계상 허용), 운영 토큰(타 팀 통합 토큰)과는 무관하다.</p>
 *
 * <pre>
 *   token(64자 hex, opaque) → { logonId, classCode, issuedAt, expiresAt }
 * </pre>
 *
 * <p>토큰 값은 {@link SecureRandom} 32바이트에 로그인 ID·발급 시각을 섞어 SHA-256으로 만든 opaque hash다.
 * 내용을 해독할 수 없고 서버 저장소에 있어야만 유효하다. 발급 때마다 만료된 항목을 정리해 무한 증가를 막는다.</p>
 *
 * <p>활성 조건: {@code custom.wpf-auth-prototype.enabled=true}. 시각은 {@link Clock}으로 주입받아 테스트에서
 * 만료를 흉내 낼 수 있게 한다.</p>
 */
@Component
@ConditionalOnProperty(name = "custom.wpf-auth-prototype.enabled", havingValue = "true")
public class WpfPrototypeTokenStore {

    private static final Logger log = LoggerFactory.getLogger(WpfPrototypeTokenStore.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** 저장소 한 항목. 사번(logonId)은 WPF API의 사용자 식별값으로 쓰인다. */
    public record Entry(String token, String logonId, String classCode, OffsetDateTime issuedAt, OffsetDateTime expiresAt) {
        public boolean isExpired(OffsetDateTime now) {
            return !expiresAt.isAfter(now);
        }
    }

    private final Map<String, Entry> tokens = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Duration ttl;
    private final Clock clock;

    /** Spring이 쓰는 생성자(생성자가 둘이라 @Autowired로 지정). */
    @Autowired
    public WpfPrototypeTokenStore(WpfAuthPrototypeProps props) {
        this(props.getTokenTtlMinutes(), Clock.system(KST));
    }

    /** 테스트용: 유효기간과 시계를 직접 지정한다. */
    public WpfPrototypeTokenStore(Duration ttl, Clock clock) {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException("token-ttl-minutes 는 0보다 커야 합니다: " + ttl);
        }
        this.ttl = ttl;
        this.clock = clock;
        log.warn("[WPF] SSO·토큰 프로토타입 저장소가 활성화되었습니다(ttl={}). 운영 인증이 아닙니다.", ttl);
    }

    /** 새 토큰을 발급해 저장한다. 같은 사용자의 이전 토큰은 만료 전까지 그대로 유효하다(동시 요청 재시도 보호). */
    public Entry issue(String logonId, String classCode) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        evictExpired(now);
        String token = newToken(logonId, now);
        Entry entry = new Entry(token, logonId, classCode, now, now.plus(ttl));
        tokens.put(token, entry);
        log.info("[WPF] 프로토타입 토큰 발급 logonId={} expiresAt={} (활성 토큰 {}개)", logonId, entry.expiresAt(), tokens.size());
        return entry;
    }

    /**
     * 토큰이 저장소에 있고 만료 전이면 항목을 돌려준다. 만료된 토큰은 이때 제거한다.
     * 없거나 만료면 {@link Optional#empty()} — 호출자가 401로 변환한다.
     */
    public Optional<Entry> find(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        Entry entry = tokens.get(token);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.isExpired(OffsetDateTime.now(clock))) {
            tokens.remove(token);
            log.info("[WPF] 프로토타입 토큰 만료 logonId={} expiresAt={}", entry.logonId(), entry.expiresAt());
            return Optional.empty();
        }
        return Optional.of(entry);
    }

    public int size() {
        return tokens.size();
    }

    public Duration ttl() {
        return ttl;
    }

    private void evictExpired(OffsetDateTime now) {
        tokens.values().removeIf(entry -> entry.isExpired(now));
    }

    /** SecureRandom 32바이트 + logonId + 발급 시각 → SHA-256 hex(64자). */
    private String newToken(String logonId, OffsetDateTime now) {
        byte[] seed = new byte[32];
        random.nextBytes(seed);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(seed);
            digest.update(logonId.getBytes(StandardCharsets.UTF_8));
            digest.update(now.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 을 사용할 수 없습니다.", ex);
        }
    }
}
