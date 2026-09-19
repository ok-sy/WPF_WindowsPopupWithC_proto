import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { CustomDialogTitle, CustomDragableDialog } from '@local/ui';
import {
  Button,
  DialogActions,
  DialogContent,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import type { ApiRequestContext, RuleProgressHistory } from '@local/domain';
import { useCallback, useEffect, useState } from 'react';
import { rootSx } from './style';
import CustomGrid from '@/components/CustomGrid/CustomGrid';
import { CustomGridColumn } from '@/components/CustomGrid/grid-type';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import CLDocTableBody from '@/components/CLDocTableBody';

export type RuleProgressHstDialogProps = {
  open: boolean;
  onClose: () => void;
  data?: RuleProgressHistory[];
  ruleid?: string;
};

export default function RuleProgressHstDialog(props: RuleProgressHstDialogProps) {
  const { open, onClose, data, ruleid } = props;

  const api = useApi();
  const [listData, setListData] = useState<RuleProgressHistory[]>([]);
  useEffect(() => {
    if (!data) return;
    setListData(data);
  }, [data]);
  const ruleProgressHst = useCallback(
    async (params: { ruleid?: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.rule.ruleProgressList({
          ctx,
          ...params,
        });
        setListData(body.ruleProgressHistoryVo);
        if (ctx.canceled) return;
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  useEffect(() => {
    if (!ruleid) return;
    const ctx = { canceled: false } as ApiRequestContext;
    ruleProgressHst({ ruleid: ruleid }, ctx);
  }, [ruleid, ruleProgressHst]);
  return (
    <CustomDragableDialog
      maxWidth="md"
      fullWidth
      backLightOn
      className="RuleProgressHstDialog-root"
      sx={rootSx}
      open={open}
      onClose={onClose}
    >
      <CustomDialogTitle title="룰진행상태" onClose={onClose}></CustomDialogTitle>

      <DialogContent
        dividers
        className="RuleProgressHstDialog-content"
        sx={{ py: 1, px: 2, minHeight: 300 }}
      >
        <TableContainer
          sx={{
            border: '1px solid #e0e0e0',
            '& .MuiTypography-root': {
              fontSize: '0.75rem',
            },
            '& .MuiTableCell-root': {
              border: '1px solid #e0e0e0',
              px: 0.5,
              whiteSpace: 'nowrap',
              '&:nth-of-type(1)': {
                width: 100,
                maxWidth: 100,
                minWidth: 100,
              },
              '&:nth-of-type(2)': {
                width: 100,
                maxWidth: 100,
                minWidth: 100,
              },
              '&:nth-of-type(3)': {
                width: 80,
                maxWidth: 80,
                minWidth: 80,
                textAlign: 'center',
              },
              '&:nth-of-type(4)': {
                width: 120,
                maxWidth: 120,
                minWidth: 120,
              },
              '&:nth-of-type(5)': {
                width: 120,
                maxWidth: 120,
                minWidth: 120,
                textAlign: 'center',
              },
              '&:nth-of-type(6)': {
                width: 100,
                maxWidth: 100,
                minWidth: 100,
              },
            },
          }}
        >
          <CLStyledTable noMargin>
            <CustomColoredTableHead
              yPadding="small"
              sx={{
                '& .MuiTableCell-root': {
                  textAlign: 'center',
                },
              }}
            >
              <TableRow>
                <TableCell>룰버전</TableCell>
                <TableCell>룰상태</TableCell>
                <TableCell>적용상태</TableCell>
                <TableCell>배포대기적용상태</TableCell>
                <TableCell>변경일시</TableCell>
                <TableCell>변경자</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            <CLDocTableBody yPadding="small">
              {listData.map((el, idx) => {
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Typography textAlign="right">{el.ruleVerno.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="center">{el.ruleState}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>
                        {el.currentRuleApplyYn === 'N'
                          ? '미적용'
                          : el.currentRuleApplyYn === 'Y'
                            ? '적용'
                            : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="center">
                        {el.deployWaitStateApplyYn === 'N'
                          ? '미적용'
                          : el.deployWaitStateApplyYn === 'Y'
                            ? '적용'
                            : 'NA'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>{el.updateDatetime}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="center">{el.updateUserid}</Typography>
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
