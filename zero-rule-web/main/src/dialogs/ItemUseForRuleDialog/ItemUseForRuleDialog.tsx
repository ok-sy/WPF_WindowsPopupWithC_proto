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
import CLDocTableHead from '@/components/CLDocTableHead';
import CLDocTableBody from '@/components/CLDocTableBody';
import type { ApiRequestContext, ItemMgmtUsedRuleInfo } from '@local/domain';
import { ruleStateKorean } from '@/lib/common-code-data';
import { useApi } from '@/provider';
import { useCallback, useEffect, useState } from 'react';
import errorCustomHandle from '@/lib/error-custom-handle';

export type ItemUseForRuleDialogProps = {
  open: boolean;
  onClose: () => void;
  data: string;
  itemNm: string;
};

export default function ItemUseForRuleDialog(props: ItemUseForRuleDialogProps) {
  const { open, onClose, data, itemNm } = props;
  const api = useApi();
  const [listData, setListData] = useState<ItemMgmtUsedRuleInfo[]>([]);
  const doReload = useCallback(
    async (params: { itemid: string }, ctx: ApiRequestContext) => {
      try {
        const { body } = await api.itemMgmt.itemMgmtUsedRuleInfo({ ctx, ...params });
        setListData(body.usedRuleInfo);
      } catch (err) {
        errorCustomHandle(err);
      }
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload({ itemid: data }, ctx);
  }, [data, doReload]);
  return (
    <CustomDragableDialog
      maxWidth="sm"
      fullWidth
      backLightOn
      className="ItemUseForRuleDialog-root"
      sx={rootSx}
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        onClose();
      }}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
      disableEscapeKeyDown
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <CustomDialogTitle title={`항목 사용중인 룰 (항목:${itemNm})`}></CustomDialogTitle>
        <Typography sx={{ mr: 3 }}>총{listData.length}건</Typography>
      </Stack>

      <DialogContent dividers className="ItemUseForRuleDialog-content" sx={{ p: 0 }}>
        <TableContainer
          sx={{
            minHeight: 300,
            whiteSpace: 'nowrap',
            maxHeight: 300,
          }}
        >
          <CLStyledTable noMargin>
            <CLDocTableHead
              yPadding="small"
              sx={{ '& .MuiTableCell-root': { textAlign: 'center' } }}
            >
              <TableRow>
                <TableCell>룰ID</TableCell>
                <TableCell>룰명</TableCell>
                <TableCell>현재상태</TableCell>
                <TableCell>활성화여부</TableCell>
              </TableRow>
            </CLDocTableHead>
            <CLDocTableBody yPadding="small">
              {listData.map((el, idx) => {
                return (
                  <TableRow key={idx} sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }}>
                    <TableCell>
                      <Typography textAlign="center">{el.ruleid}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>{el.ruleNm}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="center">{ruleStateKorean(el.ruleState)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="center">{el.activateYn}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          닫기
        </Button>
      </DialogActions>
    </CustomDragableDialog>
  );
}
