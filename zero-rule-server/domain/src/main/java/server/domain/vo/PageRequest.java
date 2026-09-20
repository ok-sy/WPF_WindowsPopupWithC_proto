package server.domain.vo;

/**
 * PdsFile 객체의 pdsId 업데이트
 */
@lombok.Data
@lombok.Builder
public class PageRequest {
    private int pageNumber;
    private int rowsPerPage;
}
