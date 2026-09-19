package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class WordInfo {
    @Schema(description = "단어 한글명")
    private String wordKorNm;

    @Schema(description = "단어 물리명")
    private String wordPhyNm;

    @Schema(description = "영문 FULL NAME")
    private String engFullNm;

    @Schema(description = "엔티티 분류 여부")
    private String enttClasYn;

    @Schema(description = "속성 분류 여부")
    private String atrbClasYn;

    @Schema(description = "단어 동의어")
    private String wordSynm;

    @Schema(description = "단어 설명")
    private String wordExpl;


}
