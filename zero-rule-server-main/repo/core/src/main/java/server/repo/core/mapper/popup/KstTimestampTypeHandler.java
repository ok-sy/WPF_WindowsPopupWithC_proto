package server.repo.core.mapper.popup;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * OffsetDateTime 파라미터를 KST 로컬 시각의 TIMESTAMP로 바인딩하는 MyBatis 타입 핸들러.
 *
 * <p>[추가 이유 — 기준 5] POPUP 스키마의 TIMESTAMP 컬럼은 시간대 없이 KST 로컬 시각을 저장한다.
 * PostgreSQL에서는 timestamptz 바인드가 세션 시간대로 자동 변환됐지만, Oracle은 TIMESTAMP WITH TIME ZONE
 * 바인드를 TIMESTAMP 컬럼에 넣을 때 시간대만 버리므로 클라이언트가 +00:00으로 보낸 값이 9시간 어긋난다.
 * 이 핸들러는 어떤 오프셋으로 들어와도 KST 벽시계 시각으로 바꿔 {@code setTimestamp}로 바인딩한다.
 * 매퍼 XML에서 {@code #{x, typeHandler=server.repo.core.mapper.popup.KstTimestampTypeHandler}}처럼
 * 파라미터 단위로만 지정한다(전역 등록 시 다른 모듈에 영향).</p>
 *
 * <p>조회 방향은 사용하지 않는다. SELECT는 {@code FROM_TZ(col, 'Asia/Seoul')}로 TIMESTAMP WITH TIME ZONE을
 * 내려 MyBatis 기본 OffsetDateTimeTypeHandler가 처리한다. 만약 결과 매핑에 지정되면 세션 시간대 기준으로
 * 읽은 뒤 KST 오프셋을 붙인다.</p>
 */
public class KstTimestampTypeHandler extends BaseTypeHandler<OffsetDateTime> {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final ZoneOffset KST_OFFSET = ZoneOffset.ofHours(9);

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, OffsetDateTime parameter, JdbcType jdbcType)
            throws SQLException {
        ps.setTimestamp(i, Timestamp.valueOf(parameter.atZoneSameInstant(KST).toLocalDateTime()));
    }

    @Override
    public OffsetDateTime getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return toOffset(rs.getTimestamp(columnName));
    }

    @Override
    public OffsetDateTime getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return toOffset(rs.getTimestamp(columnIndex));
    }

    @Override
    public OffsetDateTime getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return toOffset(cs.getTimestamp(columnIndex));
    }

    private static OffsetDateTime toOffset(Timestamp value) {
        return value == null ? null : value.toLocalDateTime().atOffset(KST_OFFSET);
    }
}
