import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
import { TableCell, TableRow, Typography } from '@mui/material';
import type { RuleDeployWaitVo } from '@local/domain';
import clsx from 'clsx';

type Props = {
  data: RuleDeployWaitVo;
  onClickOpenDialog: (name: string, data: RuleDeployWaitVo) => void;
  onSubmitClick: (data: RuleDeployWaitVo) => void;
  selected: boolean;
  checked: string[];
  checkHandle: (value: string, checked: boolean) => void;
  disabled: boolean;
};
export default function RuleDeployRow(props: Props) {
  const { data, onSubmitClick, onClickOpenDialog, selected, checkHandle, checked, disabled } =
    props;
  const {
    deployWaitDatetime,
    deployWaitStateAppyYn,
    deployWaitUserid,
    ifid,
    ruleApplyYn,
    ruleModifyYn,
    ruleNm,
    ruleVerno,
    ruleid,
    updateDatetime,
    updateUserid,
    usedItemCnt,
    usedRuleCnt,
    recentDeployDate,
  } = data;
  return (
    <TableRow
      className={clsx('RuleDeployRow-root', {
        x_selected: selected,
      })}
      onClick={() => onSubmitClick(data)}
    >
      <TableCell>
        <CLStyledTableCheckBox
          onChange={(e, checked) => {
            checkHandle(ruleid, checked);
          }}
          checked={checked.includes(ruleid)}
          disabled={disabled}
        />
      </TableCell>
      {/* 현재룰적용상태 */}
      <TableCell>
        <Typography textAlign="center">
          {ruleApplyYn === 'N' ? '미적용' : ruleApplyYn === 'Y' ? '적용' : '-'}
        </Typography>
      </TableCell>
      {/* 룰변경유무 */}
      <TableCell>
        <Typography textAlign="center">
          {ruleModifyYn === 'N' ? '무' : ruleModifyYn === 'Y' ? '유' : '-'}
        </Typography>
      </TableCell>
      {/* 배포후적용상태 */}
      <TableCell>
        <Typography textAlign="center">
          {deployWaitStateAppyYn === 'N' ? '미적용' : deployWaitStateAppyYn === 'Y' ? '적용' : '-'}
        </Typography>
      </TableCell>
      {/* 인터페이스ID */}
      <TableCell>
        <Typography textAlign="center">{ifid}</Typography>
      </TableCell>
      {/* 룰ID */}
      <TableCell>
        <Typography textAlign="center">{ruleid}</Typography>
      </TableCell>
      {/* 룰버전 */}
      <TableCell
        onClick={() => onClickOpenDialog('verNo', data)}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            color: '#2c82d6',
          },
          textDecoration: 'underline',
        }}
      >
        <Typography textAlign="right">{Number(ruleVerno).toFixed(2)}</Typography>
      </TableCell>
      {/* 룰명 */}
      <TableCell>
        <Typography>{ruleNm}</Typography>
      </TableCell>
      {/* 룰수정자명 */}
      <TableCell>
        <Typography textAlign="center">{ruleModifyYn !== 'N' ? updateUserid : '-'}</Typography>
      </TableCell>
      {/* 룰수정일시 */}
      <TableCell>
        <Typography textAlign="center">{ruleModifyYn !== 'N' ? updateDatetime : '-'}</Typography>
      </TableCell>
      {/* 배포대기변경일시 */}
      <TableCell>
        <Typography textAlign="center">{deployWaitDatetime}</Typography>
      </TableCell>
      {/* 배포대기변경자명 */}
      <TableCell>
        <Typography textAlign="center">{deployWaitUserid}</Typography>
      </TableCell>
      {/* 사용항목수 */}
      <TableCell
        onClick={() => onClickOpenDialog('item', data)}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            color: '#2c82d6',
          },
          textDecoration: 'underline',
        }}
      >
        <Typography textAlign="right">{usedItemCnt}</Typography>
      </TableCell>
      {/* 사용하는룰수 */}
      <TableCell
        onClick={() => onClickOpenDialog('state', data)}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            color: '#2c82d6',
          },
          textDecoration: 'underline',
        }}
      >
        <Typography textAlign="right">{usedRuleCnt}</Typography>
      </TableCell>
      {/* 최근배포일시 */}
      <TableCell>
        <Typography textAlign="center">{recentDeployDate ?? '배포이력없음'}</Typography>
      </TableCell>
    </TableRow>
  );
}
