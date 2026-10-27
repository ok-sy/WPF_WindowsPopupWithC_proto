package server.repo.core.mapper.popup.sample.fulljson;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import server.domain.popup.sample.fulljson.PopupBulletinRow;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-14-03 : 서버 인계 예제
 * ■ DTIY3117 전체 JSON 단건 조회 샘플 매퍼
 * - in : popupId(String) 조회할 팝업 ID
 * - out: PopupBulletinRow 1건 또는 null
 * - SQL은 {@code src/main/resources/mappers/popup/sample/fulljson/PopupFullJsonSampleMapper.xml}.
 *
 * <p>첫 샘플은 POPU_ID 지정 조회만 한다. 사용자별 후보 선정·게시 상태·기간 조건은 관계 스키마 확인 후 [담당 구현]으로 추가한다.
 * 기존 DTIY3111 매퍼({@code PopupSingleQuerySampleMapper})와 namespace·statement ID가 겹치지 않는다.</p>
 */
@Mapper
public interface PopupFullJsonSampleMapper {

    PopupBulletinRow selectByPopupId(@Param("popupId") String popupId);
}
