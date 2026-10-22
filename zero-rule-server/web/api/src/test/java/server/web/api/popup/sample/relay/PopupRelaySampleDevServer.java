package server.web.api.popup.sample.relay;

import org.springframework.boot.builder.SpringApplicationBuilder;

/**
 * [TODO70] DB 없이 mock 백엔드(127.0.0.1:18090)와 중계 샘플(127.0.0.1:8090)을 함께 띄우는 로컬 확인용 main(IDE 실행).
 *
 * <p>실제 백엔드로 바꾸려면 시스템 속성 {@code -Dpopup.sample.relay.base-url=...}(그때 mock은 {@code -Dmock.enabled=false}).
 * 시나리오는 {@code -Dpopup.sample.relay.path=/api/wpf/popups?scenario=empty} 등으로 고른다(MockBackendServer 참조).</p>
 */
public final class PopupRelaySampleDevServer {

    private PopupRelaySampleDevServer() {
    }

    public static void main(String[] args) {
        if (!"false".equals(System.getProperty("mock.enabled"))) {
            MockBackendServer mock = new MockBackendServer("127.0.0.1", Integer.getInteger("mock.port", 18090));
            Runtime.getRuntime().addShutdownHook(new Thread(mock::close));
        }
        new SpringApplicationBuilder(RelaySampleBootConfig.class)
                .properties("server.port=8090", "server.address=127.0.0.1",
                        "popup.sample.relay.enabled=true",
                        "popup.sample.relay.base-url=" + System.getProperty("popup.sample.relay.base-url", "http://127.0.0.1:18090"))
                .run(args);
    }
}
