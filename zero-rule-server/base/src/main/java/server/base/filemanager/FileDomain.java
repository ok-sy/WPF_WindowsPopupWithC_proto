package server.base.filemanager;

import cl.cloverframework.filemanager.ICLFileDomain;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.Arrays;

/**
 * 파일 도메인
 */
public enum FileDomain implements ICLFileDomain {
    // 사용자 프로필 이미지는 미사용
    USER_PROFILE("uspr", null, "userProfile", "사용자 프로필 이미지"),
    PDS("pds0", "PDS_FILE", "pds", "자료실"),
    ;

    /**
     * 파일 ID 앞글자
     */
    private final String prefix;

    /**
     * 데이터베이스 테이블 이름
     */
    @Nullable
    private final String tableName;

    /**
     * 디스크에 저장할 폴더이름
     */
    private final String folderName;


    /**
     * 설명
     */
    private final String desc;

    FileDomain(
            String prefix,
            @Nullable String tableName,
            String folderName,
            String desc
    ) {
        this.prefix = prefix;
        this.tableName = tableName;
        this.folderName = folderName;
        this.desc = desc;
    }

    @Nullable
    public String getTableName() {
        return tableName;
    }

    /**
     * prefix로 FileDomain 찾기
     *
     * @param prefix prefix
     * @return 찾은 FileDomain 객체
     */
    @Nullable
    public static FileDomain findByPrefix(@NonNull String prefix) {
        return Arrays.stream(values()).filter(it -> it.prefix.equals(prefix)).findFirst().orElse(null);
    }

    @Nullable
    public static FileDomain findByName(@NonNull String name) {
        return Arrays.stream(values()).filter(it -> it.getName().equals(name)).findFirst().orElse(null);
    }

    @NonNull
    @Override
    public String getName() {
        return this.name();
    }

    @NonNull
    @Override
    public String getPrefix() {
        return this.prefix;
    }

    @NonNull
    @Override
    public String getFolderName() {
        return this.folderName;
    }

    @NonNull
    @Override
    public String getDesc() {
        return desc;
    }
}
