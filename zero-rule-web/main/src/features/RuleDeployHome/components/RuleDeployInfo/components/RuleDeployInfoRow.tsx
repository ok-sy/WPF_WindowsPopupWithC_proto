import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
import TextOverField from '@/components/TextOverField';
import { TableCell, TableRow, Typography } from '@mui/material';
import type { RuleDeployHistory } from '@local/domain';
import clsx from 'clsx';

type Props = {
  data: RuleDeployHistory;
  seq: number;
  onSubmitClick: (selIdx: number) => void;
  selected: boolean;
  onClickUsedCnt: (data: RuleDeployHistory, name: string) => void;
};
export default function RuleDeployInfoRow(props: Props) {
  const { data, onSubmitClick, selected, seq, onClickUsedCnt } = props;
  const {
    afterDeployApplyYn,
    beforeDeployApplyYn,
    deployDatetime,
    deployUserid,
    ifid,
    ruleNm,
    ruleUpdateYn,
    ruleVerno,
    ruleid,
    usedItemCnt,
    usedRuleCnt,
    ruleCallD3,
    ruleCheckD3,
  } = data;
  return (
    <TableRow
      className={clsx('RuleDeployInfoRow-root', {
        x_selected: selected,
      })}
      onClick={() => {
        onSubmitClick(seq);
      }}
    >
      {/* 룰배포일시 */}
      <TableCell>
        <Typography>{deployDatetime}</Typography>
      </TableCell>
      {/* 룰배포전운영상태 */}
      <TableCell>
        <Typography>
          {beforeDeployApplyYn === 'N' ? '미적용' : beforeDeployApplyYn === 'Y' ? '적용' : '-'}
        </Typography>
      </TableCell>
      {/* 룰배포후상태 */}
      <TableCell>
        <Typography>
          {afterDeployApplyYn === 'N' ? '미적용' : afterDeployApplyYn === 'Y' ? '적용' : '-'}
        </Typography>
      </TableCell>
      {/* 룰변경여부 */}
      <TableCell>
        <Typography>{ruleUpdateYn === 'N' ? '무' : '유'}</Typography>
      </TableCell>
      {/* 인터페이스ID */}
      <TableCell>
        <Typography>{ifid}</Typography>
      </TableCell>
      {/* 룰ID */}
      <TableCell>
        <Typography>{ruleid}</Typography>
      </TableCell>
      {/* 룰명 */}
      <TableCell>
        <Typography>
          <TextOverField maxWidth={250} text={ruleNm} fontSize="0.75rem" />
        </Typography>
      </TableCell>
      {/* 룰호출건수D3 */}
      <TableCell>
        <Typography textAlign="right">{ruleCallD3}</Typography>
      </TableCell>
      {/* 점검건수D3 */}
      <TableCell>
        <Typography textAlign="right">{ruleCheckD3}</Typography>
      </TableCell>
      {/* 배포자 */}
      <TableCell>
        <Typography>{deployUserid}</Typography>
      </TableCell>
      {/* 사용하는항목수 */}
      <TableCell
        sx={{
          cursor: 'pointer',
          '&:hover': {
            color: '#2c82d6',
          },
          textDecoration: 'underline',
        }}
        onClick={() => onClickUsedCnt(data, 'item')}
      >
        <Typography textAlign="right">{usedItemCnt}</Typography>
      </TableCell>
      {/* 사용하는룰수 */}
      <TableCell
        sx={{
          cursor: 'pointer',
          '&:hover': {
            color: '#2c82d6',
          },
          textDecoration: 'underline',
        }}
        onClick={() => onClickUsedCnt(data, 'rule')}
      >
        <Typography textAlign="right">{usedRuleCnt}</Typography>
      </TableCell>
      {/* 룰버전 */}
      <TableCell>
        <Typography textAlign="right">{Number(ruleVerno).toFixed(2)}</Typography>
      </TableCell>
    </TableRow>
  );
}
