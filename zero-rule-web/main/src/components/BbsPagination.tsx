import { Pagination } from '@mui/material';
import React from 'react';

type Props = {
  // 페이지가 변경되었을때 호출, 1페이지인 경우 pageNumber=0
  onPageChange: (pageNumber: number) => void;
  // 페이지 번호, 1페이지인 경우 0
  page: number;
  count: number;
};

/**
 * 게시판 페이지네이션
 * 주의) 서버의 페이지 번호는 0부터 시작하고
 * Mui의 페이지 번호는 1부터 시작한다.
 * 그래서 +1, -1 해준다.
 */
export default function BbsPagination(props: Props) {
  const { onPageChange, page, count } = props;

  // 페이지 버튼 클릭
  const handleClickPage = (_event: React.ChangeEvent<unknown>, pageNumber: number) =>
    onPageChange(pageNumber - 1);

  // mui에서 페이지 번호는 1부터 시작해야 한다
  return <Pagination page={page + 1} count={count} onChange={handleClickPage} />;
}
