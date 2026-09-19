import { CustomDialogTitle, CustomDragableDialog } from '@local/ui';
import {
  Button,
  DialogActions,
  DialogContent,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { rootSx } from './style';
import CLStyledTable from '@/components/CLStyledTable';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import CLDocTableBody from '@/components/CLDocTableBody';
import type { ApiRequestContext, RuleDeployWaitVo, UsedRuleDetailInfo } from '@local/domain';
import { useApi } from '@/provider';
import { useCallback, useEffect, useState } from 'react';
import errorCustomHandle from '@/lib/error-custom-handle';

export type RuleUsedRuleStateDialogProps = {
  open: boolean;
  onClose: () => void;
  data: RuleDeployWaitVo;
};

export default function RuleUsedRuleStateDialog(props: RuleUsedRuleStateDialogProps) {
  const { open, onClose, data } = props;
  const api = useApi();
  const [dataLists, setDataLists] = useState<UsedRuleDetailInfo[]>([]);
  // 목록 조회 API
  const doReload = useCallback(
    async (params: { ruleid: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.rule.usedRuleList({ ctx, ...params });
        setDataLists(body.usedRule);
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload({ ruleid: data?.ruleid }, ctx);
  }, [data, doReload]);
  return (
    <CustomDragableDialog
      maxWidth="lg"
      fullWidth
      backLightOn
      className="RuleUsedRuleStateDialog-root"
      sx={rootSx}
      open={open}
      onClose={onClose}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <CustomDialogTitle
          title={`룰에서 사용하는 룰 현재 상태(룰명: ${data?.ruleNm})`}
        ></CustomDialogTitle>
        <Typography sx={{ mr: 3 }}>총{dataLists.length}건</Typography>
      </Stack>
      <DialogContent
        dividers
        className="RuleUsedRuleStateDialog-content"
        sx={{ p: 0, minHeight: 300 }}
      >
        <TableContainer
          sx={{
            p: 0,
            '& .MuiTableCell-root': {
              px: 0.5,
              border: '1px solid #e0e0e0',
              ':nth-of-type(1)': { width: 100, minWidth: 100, maxWidth: 100, textAlign: 'center' },
              ':nth-of-type(2)': { width: 100, minWidth: 100, maxWidth: 100, textAlign: 'center' },
              ':nth-of-type(3)': { width: 150, minWidth: 150, maxWidth: 150 },
              ':nth-of-type(4)': { width: 100, minWidth: 100, maxWidth: 100, textAlign: 'center' },
              ':nth-of-type(5)': { width: 100, minWidth: 100, maxWidth: 100, textAlign: 'center' },
              ':nth-of-type(6)': { width: 150, minWidth: 150, maxWidth: 150, textAlign: 'center' },
              ':nth-of-type(7)': { width: 100, minWidth: 100, maxWidth: 100, textAlign: 'center' },
            },
          }}
        >
          <CLStyledTable noMargin>
            <CustomColoredTableHead
              yPadding="small"
              sx={{ '& .MuiTableCell-root': { textAlign: 'center' } }}
            >
              <TableRow>
                <TableCell>사용구분</TableCell>
                <TableCell>룰ID</TableCell>
                <TableCell>룰명</TableCell>
                <TableCell>룰상태</TableCell>
                <TableCell>수정자명</TableCell>
                <TableCell>수정일시</TableCell>
                <TableCell>룰적용여부</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            <CLDocTableBody yPadding="small">
              {dataLists.map((el, idx) => {
                const {
                  ruleApplyYn,
                  ruleNm,
                  ruleState,
                  ruleid,
                  updateDatetime,
                  updateUserid,
                  useGubun,
                } = el;
                return (
                  <TableRow key={idx}>
                    <TableCell>{useGubun}</TableCell>
                    <TableCell>{ruleid}</TableCell>
                    <TableCell>{ruleNm}</TableCell>
                    <TableCell>{ruleState}</TableCell>
                    <TableCell>{updateUserid}</TableCell>
                    <TableCell>{updateDatetime}</TableCell>
                    <TableCell>
                      {ruleApplyYn === 'N' ? '미적용' : ruleApplyYn === 'Y' ? '적용' : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          닫기
        </Button>
      </DialogActions>
    </CustomDragableDialog>
  );
}
