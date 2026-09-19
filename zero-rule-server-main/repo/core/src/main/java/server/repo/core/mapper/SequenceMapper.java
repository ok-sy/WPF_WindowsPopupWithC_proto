package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SequenceMapper {
    long  nextAuthSeq();

    long  nextFileSeq();

    long  nextAccountSeq();

    long  nextCommonSeq();
}
