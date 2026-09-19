import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import { Box, Table, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import type { ApiRequestContext, ItemMgmt, ItemRef } from '@local/domain';
import { useCallback, useEffect, useState } from 'react';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import type { ItemRefModifyDialogProps } from '@/dialogs/ItemRefModifyDialog/ItemRefModifyDialog';
import ItemRefModifyDialog from '@/dialogs/ItemRefModifyDialog/ItemRefModifyDialog';
import EditIcon from '@mui/icons-material/Edit';
import { Button, Stack } from '@mui/material';
import { toast } from 'react-toastify';
import SimpleCustomGrid from '@/components/SimpleCustomGrid/SimpleCustomGrid';
import type { CustomGridColumn } from '@/components/CustomGrid/grid-type';
import { ITEM_GRID_REF_COLUMN } from '../static-refdata';

const itemRefGridColumn: CustomGridColumn[] = ITEM_GRID_REF_COLUMN;

type Props = {
  itemid?: ItemMgmt;
};
type Dialogs = 'ItemRefModifyDialog';
const ItemMgmtTail = (props: Props) => {
  const { itemid } = props;
  const [dialogs, setDialogs] = useState<Dialogs>();
  const [itemRefModifyDialogProps, setItemRefModifyDialogProps] =
    useState<ItemRefModifyDialogProps>();

  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const api = useApi();

  const [itemRef, setItemRef] = useState<ItemRef[]>([]);

  // 항목 등록 dialog
  const openDialog = () => {
    if (!itemid) {
      toast.warning('먼저 항목을 선택해주세요.');
      return;
    }
    if (!itemRef) return;
    setDialogs('ItemRefModifyDialog');
    setItemRefModifyDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
      },
      item: itemid,
      refreshItem: () => {
        setRefreshToken(Date.now);
      },
    });
  };
  const closeDialog = () => {
    setDialogs(undefined);
    setItemRefModifyDialogProps(undefined);
  };

  const doReload = useCallback(
    async (ctx: ApiRequestContext, itemid: string) => {
      try {
        setLoading(true);
        const { body } = await api.itemMgmt.itemRefList({ ctx, itemid });
        setItemRef(body.itemRefs);
        if (ctx.canceled) return false;
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
    if (itemid === undefined) return;
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx, itemid.itemid);
  }, [doReload, itemid, refreshToken]);
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <SubTitleAndIcon labelTitle="항목 참조 목록"></SubTitleAndIcon>

          <Typography fontSize={'0.75rem'}>
            {itemid !== undefined && `[${itemid?.itemid ?? ''}] ${itemid?.itemNm ?? ''}`}
          </Typography>
        </Stack>
        <Button onClick={openDialog} startIcon={<EditIcon />} color="success">
          신규/수정
        </Button>
        {/* )} */}
      </Stack>
      <SimpleCustomGrid<ItemMgmt>
        colums={itemRefGridColumn}
        rowData={itemRef}
        sx={{ minHeight: '300px' }}
        noDataTextMsg="등록된 참조목록이 없습니다."
      />
      {dialogs === 'ItemRefModifyDialog' && itemRefModifyDialogProps && (
        <ItemRefModifyDialog {...itemRefModifyDialogProps} />
      )}
    </Box>
  );
};

export default ItemMgmtTail;
