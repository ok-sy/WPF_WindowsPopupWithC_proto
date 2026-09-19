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
 * File-backed video streaming on Spring MVC / embedded Tomcat.
 * Enable explicitly and point root at a directory containing public popup videos.
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

    @GetMapping("/p/api/popups/video")
    public ResponseEntity<Resource> video(@RequestParam("path") String path) {
        Path file = resolveVideo(path);
        String name = file.getFileName().toString();
        int dot = name.lastIndexOf('.');
        String type = VIDEO_TYPES.get(name.substring(dot + 1).toLowerCase(Locale.ROOT));
        if (dot < 0 || type == null) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }

        // Keep status 200 here: Spring MVC converts Resource + Range to 206/416.
        // Do not use InputStreamResource, readAllBytes, or set a full-file Content-Length:
        // the converters stream the requested region(s) and compute their lengths.
        return ResponseEntity.ok()
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType(type))
                .body(new FileSystemResource(file));
    }


    @GetMapping("/p/api/popups/video/{*path}")
    public ResponseEntity<Resource> videoByPath(
            @org.springframework.web.bind.annotation.PathVariable("path") String path) {
        // The catch-all path variable includes its leading slash.
        return video(path.startsWith("/") ? path.substring(1) : path);
    }

    private Path resolveVideo(String value) {
        if (value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        try {
            Path requested = Path.of(value);
            // Accept either a root-relative path or an absolute path inside root.
            Path candidate = root.resolve(requested).normalize();
            // Canonicalize Windows short names and symlinks/junctions before containment checks.
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