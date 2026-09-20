package server.domain.vo;

import lombok.Data;

@Data
public class GetDateServiceAvgResponeTimeVo {
    private String regDttm;

    private double avgTime;
}
