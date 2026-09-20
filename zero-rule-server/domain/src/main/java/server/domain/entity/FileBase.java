package server.domain.entity;

import cl.cloverframework.filemanager.CLFileType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.Instant;

/**
 * 업로드한 파일을 저장하는 파일 테이블의 Base 클래스
 * <p>
 * 파일 내용은 디스크에 저장되고, 테이블에는 파일ID를 보관한 후
 * 파일 ID로 디스크에 저장된 Path를 찾는 방식이다.
 * 보통의 경우 파일과 연관된 추가적인 컬럼 정의가 필요하다.
 * 예를 들면, 게시판(Bbs)이라면 게시물의 ID(postId)가 파일 테이블에 저장될 필요가 있다.
 * 이 경우 FileBase를 상속해서 구현하면 된다.
 * <pre>
 * public class BbsFile extends FileBase{
 *     long postId;
 * }
 * </pre>
 */
@SuperBuilder
@NoArgsConstructor
@Data
public class FileBase {

    /**
     * 파일 ID (64 byte)
     * PK
     */
    @NonNull
    protected String fileId;

    /**
     * 파일 타입
     */
    @NonNull
    protected CLFileType fileType;

    /**
     * 파일 이름
     */
    @Nullable
    protected String fileName;

    /**
     * 정렬번호
     */
    protected long sortNumber;

    /**
     * 파일 크기
     */
    protected long fileSize;

    /**
     * 너비, FileType이 이미지나 비디오인 경우에만 유효한 값이다.
     */
    protected int width;

    /**
     * 높이, FileType이 이미지나 비디오인 경우에만 유효한 값이다.
     */
    protected int height;


    /**
     * 재생길이, FileType이 비디오나 오디오인 경우에만 유효한 값이다.
     */
    protected int duration;

    /**
     * 파일의 컨텐트 타입
     */
    @Nullable
    protected String contentType;

    @NonNull
    protected String delYn;

    /**
     * 등록 일시
     */
    protected Instant createdAt;

    /**
     * 변경 일시
     */
    protected Instant changedAt;
}
