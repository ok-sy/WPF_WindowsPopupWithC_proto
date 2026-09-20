package server.base.impl;

import cl.cloverframework.filemanager.ICLFileIdToUrl;
import jakarta.annotation.PostConstruct;
import lombok.SneakyThrows;
import okhttp3.HttpUrl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.util.StringUtils;
import server.base.props.SystemProps;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Objects;

public class FileIdToUrlImpl implements ICLFileIdToUrl {
    @Autowired
    private SystemProps systemProps;

    public HttpUrl baseServerUrl;

    public HttpUrl imageServerUrl;

    @PostConstruct
    private void setup() {
        this.baseServerUrl = Objects.requireNonNull(HttpUrl.parse(systemProps.getBaseServerUrl()));
        String url = systemProps.getPublicImageServerUrl();
        if (url.startsWith("http://") || url.startsWith("https://")) {
            this.imageServerUrl = Objects.requireNonNull(HttpUrl.parse(url));
        } else {
            this.imageServerUrl = baseServerUrl.newBuilder().addEncodedPathSegments(url).build();
        }
    }

    private String joinBase(String path) {
        return this.baseServerUrl.newBuilder().addEncodedPathSegments(path).build().toString();
    }

    public String imageUrlByFileId(String fileId) {
        return this.imageServerUrl.toString().replace(":FILEID:", fileId);
    }

    @Nullable
    @Override
    public String url(String fileId) {
        if (!StringUtils.hasText(fileId)) return null;
        return imageUrlByFileId(fileId);
    }

    @SneakyThrows
    @Override
    public String urlWithFileName(@NonNull String fileId, @Nullable String fileName) {
        if (!StringUtils.hasText(fileId)) return null;
        if (StringUtils.hasText(fileName)) {
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.name())
                    .replace("+", "%20");
            return joinBase(String.format("p/file/download2/%s/%s", fileId, encodedFileName));
        }
        return joinBase(String.format("p/file/download2/%s/%s", fileId, fileId));
    }

    @Override
    public String timestampedUrl(@NonNull String fileId, @NonNull Instant timestamp) {
        if (!StringUtils.hasText(fileId)) return null;
        String urlString = Objects.requireNonNull(this.url(fileId));
        if (urlString.contains("?")) {
            return urlString + '&' + timestamp.toEpochMilli();
        } else {
            return urlString + '?' + timestamp.toEpochMilli();
        }
    }
}
