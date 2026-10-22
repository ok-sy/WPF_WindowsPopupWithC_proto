package server.web.api.popup.sample.relay;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.net.ServerSocket;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.ObjectMapper;


/** [TODO70] 연결 실패 분류와 envelope 매핑 함수(Spring 컨텍스트 없이). */
class BackendUnitTest {

    private static RelayBackendProperties properties(String baseUrl, RelayBackendProperties.ResponseShape shape) {
        return new RelayBackendProperties(baseUrl, "/api/wpf/popups", Duration.ofMillis(500), Duration.ofMillis(500), null, null, List.of(), shape);
    }

    @Test
    void closedPortIsConnectFailure() throws Exception {
        int port;
        try (ServerSocket socket = new ServerSocket(0)) {
            port = socket.getLocalPort();
        }
        BackendPopupClient client = new BackendPopupClient(properties("http://127.0.0.1:" + port, null), RestClient.builder());
        BackendCallException ex = assertThrows(BackendCallException.class, () -> client.fetch(Map.of()));
        assertEquals(BackendCallException.Kind.CONNECT, ex.kind());
        assertEquals(0, ex.status());
    }

    @Test
    void envelopeMappingUnwrapsDataOnly() throws Exception {
        ObjectMapper json = new ObjectMapper();
        BackendResponseMapper mapper = new BackendResponseMapper(json, properties("http://x", RelayBackendProperties.ResponseShape.ENVELOPE));
        assertEquals(json.readTree(MockBackendServer.OK_BODY), mapper.toWpfResponse("{\"resultCode\":\"0000\",\"data\":" + MockBackendServer.OK_BODY + "}"));
        BackendCallException ex = assertThrows(BackendCallException.class, () -> mapper.toWpfResponse(MockBackendServer.OK_BODY));
        assertEquals(BackendCallException.Kind.INVALID_RESPONSE, ex.kind(), "envelope 설정인데 data가 없으면 계약 불일치");
    }

    @Test
    void wpfShapeRejectsPopupWithoutIdentity() {
        BackendResponseMapper mapper = new BackendResponseMapper(new ObjectMapper(), properties("http://x", null));
        BackendCallException ex = assertThrows(BackendCallException.class,
                () -> mapper.toWpfResponse("{\"pollingIntervalSeconds\":60,\"popup\":{\"title\":\"x\"}}"));
        assertEquals(BackendCallException.Kind.INVALID_RESPONSE, ex.kind());
        assertThrows(BackendCallException.class, () -> mapper.toWpfResponse("{\"pollingIntervalSeconds\":0,\"popup\":null}"));
        assertThrows(BackendCallException.class, () -> mapper.toWpfResponse("{\"pollingIntervalSeconds\":\"60\",\"popup\":null}"));
    }
}
