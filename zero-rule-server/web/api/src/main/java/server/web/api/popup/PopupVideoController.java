package server.web.api.popup;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;

/**
 * POL-05-01 : 재생 경로
 * ■ 팝업 영상 파일 스트리밍 (GET /p/api/popups/video)
 * - in : popup.video.root 공개 영상 폴더(생성자) · 요청 path
 * - out: Resource 영상 본문(Range 요청 시 206/416은 Spring MVC가 처리)
 * - 파일 기반 HTTP 영상 재생 경로다. popup.video.enabled=true일 때만 등록되며 root 밖 파일은 403으로 막는다.
 */
@RestController
@ConditionalOnProperty(name = "popup.video.enabled", havingValue = "true")
public class PopupVideoController {

    private static final Map<String, String> VIDEO_TYPES = Map.of(
            "mp4", "video/mp4", "m4v", "video/mp4",
            "webm", "video/webm", "ogv", "video/ogg");
    private final Path root;

    public PopupVideoController(@Value("${popup.video.root}") String root) throws IOException {
        if (root.isBlank()) {
            throw new IllegalArgumentException("popup.video.root must not be blank");
        }
        this.root = Path.of(root).toRealPath();
        if (!Files.isDirectory(this.root)) {
            throw new IllegalArgumentException("popup.video.root must be a directory");
        }
    }

    /**
     * ■ 쿼리 경로로 영상 스트리밍 (GET /p/api/popups/video?path=)
     * - in : path(String) root 기준 상대 경로 또는 root 안의 절대 경로
     * - out: ResponseEntity<Resource> 200(전체)·206(Range) · 400/403/404/415
     * - 확장자(mp4·m4v·webm·ogv)로 Content-Type을 정하고 캐시하지 않는다(no-store).
     */
    @GetMapping("/p/api/popups/video")
    public ResponseEntity<Resource> video(@RequestParam("path") String path) {
        Path file = resolveVideo(path);
        String name = file.getFileName().toString();
        int dot = name.lastIndexOf('.');
        String type = VIDEO_TYPES.get(name.substring(dot + 1).toLowerCase(Locale.ROOT));
        if (dot < 0 || type == null) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }

        // 여기서는 200을 유지한다: Spring MVC가 Resource + Range를 206/416으로 바꾼다.
        // InputStreamResource·readAllBytes·전체 파일 Content-Length 지정은 쓰지 않는다:
        // 변환기가 요청 구간만 스트리밍하고 길이를 계산한다.
        return ResponseEntity.ok()
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType(type))
                .body(new FileSystemResource(file));
    }


    /**
     * ■ URL 경로로 영상 스트리밍 (GET /p/api/popups/video/{*path})
     * - in : path(String) URL 경로에 붙인 root 기준 상대 경로
     * - out: {@link #video(String)}와 같다
     */
    @GetMapping("/p/api/popups/video/{*path}")
    public ResponseEntity<Resource> videoByPath(
            @org.springframework.web.bind.annotation.PathVariable("path") String path) {
        // catch-all 경로 변수는 앞의 슬래시를 포함한다.
        return video(path.startsWith("/") ? path.substring(1) : path);
    }

    /** 요청 경로를 실제 경로로 정규화하고 root 안의 읽을 수 있는 일반 파일인지 확인한다. */
    private Path resolveVideo(String value) {
        if (value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        try {
            Path requested = Path.of(value);
            // root 기준 상대 경로와 root 안의 절대 경로를 모두 받는다.
            Path candidate = root.resolve(requested).normalize();
            // 포함 여부 검사 전에 Windows 짧은 이름·심볼릭 링크/정션을 실제 경로로 바꾼다.
            Path real = candidate.toRealPath();
            if (!real.startsWith(root)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            if (!Files.isRegularFile(real) || !Files.isReadable(real)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }
            return real;
        } catch (InvalidPathException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}