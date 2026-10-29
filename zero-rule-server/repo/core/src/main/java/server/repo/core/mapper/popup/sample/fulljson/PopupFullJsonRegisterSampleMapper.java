package server.repo.core.mapper.popup.sample.fulljson;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-14-03 : 서버 인계 예제
 * ■ DTIY3117 등록·수정 샘플 매퍼
 * - in : popupId(POPU_ID) · popupJson(공통 검증을 통과한 정규화 popup JSON) · userId(등록/변경 사번)
 * - out: 반영 행 수
 * - SQL은 {@code src/main/resources/mappers/popup/sample/fulljson/PopupFullJsonRegisterSampleMapper.xml}.
 *
 * <p>검증 전 원본을 이 매퍼로 저장하지 않는다. 호출은 {@code PopupFullJsonRegisterSampleService}가 검증 통과 후에만 한다.
 * 조회 매퍼({@link PopupFullJsonSampleMapper})와 분리해 기존 조회 샘플·테스트를 바꾸지 않는다.</p>
 */
@Mapper
public interface PopupFullJsonRegisterSampleMapper {

    int insertBulletin(@Param("popupId") String popupId, @Param("popupJson") String popupJson, @Param("userId") String userId);

    int updateBulletin(@Param("popupId") String popupId, @Param("popupJson") String popupJson, @Param("userId") String userId);
}
