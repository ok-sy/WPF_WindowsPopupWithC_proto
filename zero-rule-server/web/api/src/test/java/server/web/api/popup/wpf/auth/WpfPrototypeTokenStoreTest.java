package server.web.api.popup.wpf.auth;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * [설계 10 §6.2] 프로토타입 토큰 저장소 — 발급·조회·TTL 만료·만료 정리를 고정 시계로 검증한다.
 */
class WpfPrototypeTokenStoreTest {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** 테스트에서 시각을 움직일 수 있는 시계. */
    static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override public ZoneId getZone() { return KST; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    @Test void issuedTokenIsOpaqueAndFoundUntilTtl() {
        MutableClock clock = new MutableClock(Instant.parse("2026-09-21T09:00:00Z"));
        WpfPrototypeTokenStore store = new WpfPrototypeTokenStore(Duration.ofMinutes(10), clock);

        WpfPrototypeTokenStore.Entry entry = store.issue("E1001", "A1");

        assertEquals(64, entry.token().length(), "SHA-256 hex 64자");
        assertTrue(entry.token().matches("[0-9a-f]{64}"));
        assertFalse(entry.token().contains("E1001"), "토큰에 사용자 정보가 드러나지 않는다");
        assertEquals(entry.issuedAt().plusMinutes(10), entry.expiresAt());

        Optional<WpfPrototypeTokenStore.Entry> found = store.find(entry.token());
        assertTrue(found.isPresent());
        assertEquals("E1001", found.get().logonId());
        assertEquals("A1", found.get().classCode());

        clock.advance(Duration.ofMinutes(9).plusSeconds(59));
        assertTrue(store.find(entry.token()).isPresent(), "만료 1초 전은 유효");

        clock.advance(Duration.ofSeconds(1));
        assertTrue(store.find(entry.token()).isEmpty(), "expiresAt 도달 시 만료");
        assertEquals(0, store.size(), "만료 토큰은 조회 시 제거");
    }

    @Test void unknownOrBlankTokenIsRejected() {
        WpfPrototypeTokenStore store = new WpfPrototypeTokenStore(Duration.ofMinutes(10), Clock.system(KST));
        assertTrue(store.find(null).isEmpty());
        assertTrue(store.find("").isEmpty());
        assertTrue(store.find("0".repeat(64)).isEmpty());
    }

    @Test void reloginKeepsPreviousTokenUntilExpiryAndEvictsExpiredOnes() {
        MutableClock clock = new MutableClock(Instant.parse("2026-09-21T09:00:00Z"));
        WpfPrototypeTokenStore store = new WpfPrototypeTokenStore(Duration.ofMinutes(10), clock);

        WpfPrototypeTokenStore.Entry first = store.issue("E1001", "A1");
        WpfPrototypeTokenStore.Entry second = store.issue("E1001", "A1");
        assertNotEquals(first.token(), second.token());
        // 동시 401 재시도 보호: 재로그인해도 이전 토큰은 만료 전까지 유효하다.
        assertTrue(store.find(first.token()).isPresent());
        assertEquals(2, store.size());

        clock.advance(Duration.ofMinutes(11));
        store.issue("E1002", "B2");   // 발급 시 만료 항목 정리
        assertEquals(1, store.size());
        assertTrue(store.find(first.token()).isEmpty());
        assertTrue(store.find(second.token()).isEmpty());
    }

    @Test void ttlMustBePositive() {
        assertThrows(IllegalArgumentException.class,
                () -> new WpfPrototypeTokenStore(Duration.ZERO, Clock.system(KST)));
    }
}
