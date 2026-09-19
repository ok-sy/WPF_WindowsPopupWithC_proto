import CLCodeListLabel from '@/components/CLCodeListLabel';
import CLDocLabelInput from '@/components/CLDocLabelInput';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import { RuleMapButton } from '@/components/RuleComponents/RuleMapButton';
import handleError from '@/lib/handle-error';
import { InputSearchHandle } from '@/lib/input-search-handle';
import { useApi } from '@/provider';
import { CustomDialogTitle, CustomDragableDialog, sxTableRowSelection } from '@local/ui';
import CheckIcon from '@mui/icons-material/Check';
import type { SxProps, Theme } from '@mui/material';
import { Button, DialogContent, Stack, TableCell, TableContainer, TableRow } from '@mui/material';
import type { ApiRequestContext, ItemMgmt } from '@local/domain';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
const rootSx: SxProps<Theme> = (theme) => ({
  '& .CLDocLabelInput-root': {
    '& .CLDocLabelInput-titleBox': {
      minWidth: 80,
      maxWidth: 80,
    },
  },
});
type ItemMgmtSelectParam = {
  itemNm?: string;
  itemAliasNm?: string;
  itemUseYn?: string;
};
export type RuleReturnItemAddListDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ItemMgmt) => void;
  ifid: string;
};

export default function RuleReturnItemAddListDialog(props: RuleReturnItemAddListDialogProps) {
  const { open, onClose, onSubmit, ifid } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [itemMgmtData, setItemMgmtData] = useState<ItemMgmt[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<ItemMgmt>();

  const doReload = useCallback(
    async (ctx: ApiRequestContext, params: ItemMgmtSelectParam & { ifid: string }) => {
      try {
        setLoading(true);
        const listData = await api.itemMgmt.itemMgmtSelect({ ctx, ...params });
        if (ctx.canceled) return false;
        setItemMgmtData(listData.body.itemMgmt);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx, { ifid: ifid });
  }, [doReload, ifid]);

  const { handleChangeInput, handleClickSearchBtn, handleKeyDownEnter, inputValues } =
    InputSearchHandle<ItemMgmtSelectParam>({
      onSubmitData(data) {
        const ctx = { canceled: false } as ApiRequestContext;
        doReload(ctx, { ...data, ifid: ifid });
      },
      reset: {
        itemUseYn: '',
      },
    });

  const { itemAliasNm, itemNm } = inputValues || {};
  return (
    <CustomDragableDialog
      maxWidth="md"
      fullWidth
      className="RuleReturnItemAddListDialog-root"
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
      <CustomDialogTitle title="반환항목 등록" onClose={onClose}></CustomDialogTitle>

      <DialogContent dividers className="RuleReturnItemAddListDialog-content" sx={{ p: 1 }}>
        <Stack direction="row" spacing={0.5} mb={0.5}>
          <CLDocLabelInput
            title="항목 이름"
            type="search"
            fullWidth
            value={itemNm ?? ''}
            onChange={handleChangeInput('itemNm')}
            onKeyDown={handleKeyDownEnter}
          />
          <CLDocLabelInput
            title="항목 별칭"
            type="search"
            fullWidth
            value={itemAliasNm ?? ''}
            onChange={handleChangeInput('itemAliasNm')}
            onKeyDown={handleKeyDownEnter}
          />
          <RuleMapButton
            text="검색"
            size="small"
            variant="contained"
            onClick={handleClickSearchBtn}
            startIcon={<CheckIcon />}
          ></RuleMapButton>
        </Stack>
        <TableContainer
          sx={{
            minHeight: 400,
            maxHeight: 400,
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            '& .MuiTableCell-root': {
              px: 0.5,
              '&:nth-of-type(1)': {
                width: 40,
                maxWidth: 40,
                textAlign: 'center',
              },
              '&:nth-of-type(2)': {
                whiteSpace: 'nowrap',
                width: 100,
                maxWidth: 100,
                textAlign: 'center',
              },
              '&:nth-of-type(3)': {
                whiteSpace: 'nowrap',
                width: 70,
              },
              '&:nth-of-type(4)': {
                whiteSpace: 'nowrap',
                width: 200,
              },
              '&:nth-of-type(5)': {
                whiteSpace: 'nowrap',
                width: 90,
                maxWidth: 90,
                textAlign: 'center',
              },
            },
          }}
        >
          <CLStyledTable noMargin stickyHeader>
            <CustomColoredTableHead yPadding="small">
              <TableRow sx={{ '& .MuiTableCell-root': { textAlign: 'center' } }}>
                <TableCell>순서</TableCell>
                <TableCell>항목ID</TableCell>
                <TableCell>항목 이름</TableCell>
                <TableCell>항목 별칭</TableCell>
                <TableCell>데이터타입명</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            <CLDocTableBody textAlign="center" sx={sxTableRowSelection}>
              {itemMgmtData.map((el, idx) => {
                return (
                  <TableRow
                    onDoubleClick={() => {
                      if (!selectedItemId) return;
                      onSubmit(selectedItemId);
                      onClose();
                    }}
                    className={clsx({ x_selected: el.itemid === selectedItemId?.itemid })}
                    key={idx}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedItemId(el);
                    }}
                  >
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{el.itemid}</TableCell>
                    <TableCell>{el.itemNm}</TableCell>
                    <TableCell>{el.itemAliasNm}</TableCell>
                    <TableCell>{el.dataTypeNm}</TableCell>
                  </TableRow>
                );
              })}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
          <Button
            onClick={() => {
              if (!selectedItemId) {
                toast.warning('아이템을 선택해주세요');
                return;
              }
              onSubmit(selectedItemId);
              onClose();
            }}
            size="small"
            variant="contained"
            startIcon={<CheckIcon />}
          >
            추가
          </Button>
          <Button size="small" variant="contained" onClick={onClose}>
            취소
          </Button>
        </Stack>
      </DialogContent>
    </CustomDragableDialog>
  );
}
