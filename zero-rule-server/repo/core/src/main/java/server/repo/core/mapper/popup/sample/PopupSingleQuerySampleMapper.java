package server.repo.core.mapper.popup.sample;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import server.domain.popup.sample.PopupContentRow;

/**
 * [TODO65] 단건 조회 매퍼. SQL은 {@code src/main/resources/sample/mapper/PopupSingleQueryMapper.xml}.
 *
 * <p>내부 쿼리에서 후보를 정렬하고 외부에서 {@code ROWNUM = 1}로 1건만 받는다(Oracle 11g 호환, FETCH FIRST 미사용).
 * 결과가 없으면 null이다.</p>
 *
 * @param userId          조회 사용자(사번). [담당 구현] 대상자 조건에 사용
 * @param contentId       [샘플 조건] 확인용 콘텐츠 ID 지정(null이면 조건 없음). 업무 후보 판단이 아니다
 * @param contentTypeCode [샘플 조건] 유형 코드 지정(null이면 조건 없음)
 */
@Mapper
public interface PopupSingleQuerySampleMapper {

    PopupContentRow selectNextCandidate(@Param("userId") String userId,
                                        @Param("contentId") String contentId,
                                        @Param("contentTypeCode") String contentTypeCode);
}
