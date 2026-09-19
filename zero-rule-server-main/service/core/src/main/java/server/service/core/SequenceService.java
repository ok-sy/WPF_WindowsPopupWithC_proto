package server.service.core;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import server.repo.core.mapper.SequenceMapper;

@Service
public class SequenceService {
    @Autowired
    SequenceMapper sequenceMapper;

    /**
     * Account ID 채번
     */
    public long nextUserId() {
        return sequenceMapper.nextAccountSeq();
    }

    /**
     * 인증 일련 번호 채번
     */
    public long nextAuthSeq() {
        return sequenceMapper.nextAuthSeq();
    }

    /**
     * File 일련 번호 채번
     */
    public long nextFileSeq() {
        return sequenceMapper.nextFileSeq();
    }

    /**
     * 공통적으로 사용하는 sequence 번호 채번
     */
    public long nextCommonSeq() {
        return sequenceMapper.nextCommonSeq();
    }
}
