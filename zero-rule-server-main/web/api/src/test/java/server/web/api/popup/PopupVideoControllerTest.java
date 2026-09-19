package server.web.api.popup;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PopupVideoControllerTest {
    @TempDir Path temp;
    private MockMvc mvc;
    private byte[] bytes;
    private Path root;

    @BeforeEach
    void setup() throws Exception {
        root = Files.createDirectory(temp.resolve("videos"));
        bytes = new byte[4096];
        for (int i = 0; i < bytes.length; i++) bytes[i] = (byte) (i % 251);
        Files.write(root.resolve("demo.mp4"), bytes);
        Files.write(temp.resolve("outside.mp4"), bytes);
        Files.writeString(root.resolve("secret.txt"), "not a video");
        mvc = MockMvcBuilders.standaloneSetup(new PopupVideoController(root.toString())).build();
    }

    @Test
    void streamsWholeFile() throws Exception {
        mvc.perform(get("/p/api/popups/video").param("path", "demo.mp4"))
                .andExpect(status().isOk())
                .andExpect(header().string("Accept-Ranges", "bytes"))
                .andExpect(content().contentType("video/mp4"))
                .andExpect(content().bytes(bytes));
    }

    @Test
    void streamsExactRangeFromAbsolutePath() throws Exception {
        mvc.perform(get("/p/api/popups/video").param("path", root.resolve("demo.mp4").toString())
                        .header("Range", "bytes=512-1023"))
                .andExpect(status().isPartialContent())
                .andExpect(header().string("Content-Range", "bytes 512-1023/4096"))
                .andExpect(header().string("Content-Length", "512"))
                .andExpect(content().bytes(Arrays.copyOfRange(bytes, 512, 1024)));
    }

    @Test
    void streamsSuffixAndOpenEndedRange() throws Exception {
        for (String range : new String[]{"bytes=-512", "bytes=3584-"}) {
            mvc.perform(get("/p/api/popups/video").param("path", "demo.mp4").header("Range", range))
                    .andExpect(status().isPartialContent())
                    .andExpect(header().string("Content-Range", "bytes 3584-4095/4096"))
                    .andExpect(content().bytes(Arrays.copyOfRange(bytes, 3584, 4096)));
        }
    }

    @Test
    void rejectsUnsatisfiableRange() throws Exception {
        mvc.perform(get("/p/api/popups/video").param("path", "demo.mp4").header("Range", "bytes=4096-"))
                .andExpect(status().isRequestedRangeNotSatisfiable())
                .andExpect(header().string("Content-Range", "bytes */4096"));
    }

    @Test
    void rejectsPathsOutsideRoot() throws Exception {
        for (String path : new String[]{"../outside.mp4", temp.resolve("outside.mp4").toString()}) {
            mvc.perform(get("/p/api/popups/video").param("path", path))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void rejectsMissingInvalidAndUnsupportedFiles() throws Exception {
        mvc.perform(get("/p/api/popups/video").param("path", "missing.mp4"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/p/api/popups/video").param("path", " "))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/p/api/popups/video").param("path", "secret.txt"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void streamsNewNestedFileByUrlPath() throws Exception {
        Path folder = Files.createDirectories(root.resolve("education"));
        Files.write(folder.resolve("demo.mp4"), bytes);
        mvc.perform(get("/p/api/popups/video/education/demo.mp4")
                        .header("Range", "bytes=0-1023"))
                .andExpect(status().isPartialContent())
                .andExpect(header().string("Content-Range", "bytes 0-1023/4096"))
                .andExpect(header().string("Content-Length", "1024"))
                .andExpect(content().bytes(Arrays.copyOfRange(bytes, 0, 1024)));
        mvc.perform(get("/p/api/popups/video/education/demo.mp4")
                        .header("Range", "bytes=4096-"))
                .andExpect(status().isRequestedRangeNotSatisfiable());
    }

    @Test
    void urlPathHandlesSpacesAndRejectsMissingAndOutsideFiles() throws Exception {
        Files.write(root.resolve("training video.mp4"), bytes);
        mvc.perform(get("/p/api/popups/video/{name}", "training video.mp4"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(bytes));
        mvc.perform(get("/p/api/popups/video/missing.mp4"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/p/api/popups/video/../outside.mp4"))
                .andExpect(status().isForbidden());
    }
}