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
import type { ApiRequestContext, RuleDeployWaitVo, UsedItemInfo } from '@local/domain';
import { useApi } from '@/provider';
import { useCallback, useEffect, useState } from 'react';
import errorCustomHandle from '@/lib/error-custom-handle';

export type RuleUsedItemDialogProps = {
  open: boolean;
  onClose: () => void;
  data: RuleDeployWaitVo;
};

export default function RuleUsedItemDialog(props: RuleUsedItemDialogProps) {
  const { open, onClose, data } = props;
  const api = useApi();
  const [dataLists, setDataLists] = useState<UsedItemInfo[]>([]);

  // 목록조회API
  const doReload = useCallback(
    async (params: { ruleid: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.rule.usedItemList({ ctx, ...params });
        setDataLists(body.usedItem);
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
      maxWidth="sm"
      fullWidth
      backLightOn
      className="RuleUsedItemDialog-root"
      sx={rootSx}
      open={open}
      onClose={onClose}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <CustomDialogTitle
          title={`룰에서 사용하는 항목리스트(룰명: ${data?.ruleNm})`}
        ></CustomDialogTitle>
        <Typography sx={{ mr: 3 }}>총{dataLists.length}건</Typography>
      </Stack>
      <DialogContent dividers className="RuleUsedItemDialog-content" sx={{ p: 0, minHeight: 300 }}>
        <TableContainer
          sx={{
            p: 0,
            '& .MuiTableCell-root': {
              px: 0.5,
              border: '1px solid #e0e0e0',
              ':nth-of-type(1)': { width: 100, minWidth: 100, maxWidth: 100, textAlign: 'center' },
              ':nth-of-type(2)': { width: 100, minWidth: 100, maxWidth: 100, textAlign: 'center' },
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
                <TableCell>항목ID</TableCell>
                <TableCell>항목명</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            <CLDocTableBody yPadding="small">
              {dataLists.map((el, idx) => {
                const { itemNm, itemid, useGubun } = el;
                return (
                  <TableRow key={idx}>
                    <TableCell>{useGubun}</TableCell>
                    <TableCell>{itemid}</TableCell>
                    <TableCell>{itemNm}</TableCell>
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
