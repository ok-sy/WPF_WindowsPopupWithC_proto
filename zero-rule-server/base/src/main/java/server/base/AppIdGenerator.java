package server.base;

public interface AppIdGenerator {
    /**
     * 64 바이트 ID 생성
     */
    String gen64(String prefix, long seq);


    /**
     * 32 바이트 ID 생성
     */
    String gen32(String prefix, long seq);
}
