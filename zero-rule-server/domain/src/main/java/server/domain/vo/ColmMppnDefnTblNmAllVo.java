package server.domain.vo;

import cl.cloverframework.impl.code.CLPrivType;
import cl.cloverframework.impl.domain.entity.CLPriv;
import cl.cloverframework.impl.domain.vo.CLPrivVo;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.lang.Nullable;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.List;


@Data
public class ColmMppnDefnTblNmAllVo {
    @Schema(description = "To Be 테이블 물리명")
    private String tobeTblPhyNm;
    @Schema(description = "To Be 테이블 한글명")
    private String tobeTblKorNm;
    @Schema(description = "AS IS 테이블 물리명")
    private String asisTblPhyNm;
    @Schema(description = "AS IS 테이블 한글명")
    private String asisTblKorNm;
}


