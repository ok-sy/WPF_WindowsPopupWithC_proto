import { Portlet, PortletContent, useElementLeftTop } from '@local/ui';
// CLDocTableBody, CLDocTableHead
import type { CustomGridColumn } from '@/components/CustomGrid/grid-type';
import SimpleCustomGrid from '@/components/SimpleCustomGrid/SimpleCustomGrid';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import type { ItemUseForRuleDialogProps } from '@/dialogs/ItemUseForRuleDialog';
import ItemUseForRuleDialog from '@/dialogs/ItemUseForRuleDialog/ItemUseForRuleDialog';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { Box, Button, Divider, IconButton, Stack } from '@mui/material';
import type { ItemMgmt } from '@local/domain';
import { useMemo, useRef, useState } from 'react';
import type { ItemInsertProps } from './components/ItemInsert';
import ItemInsertAndModify from './components/ItemInsert';
import type { Dialogs } from './components/ItemMgmtBody';
import ItemMgmtHead from './components/ItemMgmtHead';
import ItemMgmtTail from './components/ItemMgmtTail';
import { ITEM_GRID_COLUMN, dataTypeToCode } from './static-data';
import { rootSx } from './style';

export default function ItemMgmtHome() {
  // 항목관리 등록 버튼 모달컴포넌트

  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);

  const [itemListInsertProps, setItemListInsertProps] = useState<ItemInsertProps>();
  const [dialogs, setDialogs] = useState<Dialogs>('');

  const [itemMgmtData, setItemMgmtData] = useState<ItemMgmt[]>([]);

  const [refreshToken, setRefreshToken] = useState(0);

  const [selectedItemId, setSelectedItemId] = useState<ItemMgmt>();

  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [itemUseForRuleDialogProps, setItemUseForRuleDialogProps] =
    useState<ItemUseForRuleDialogProps>();

  const onClickCellDialogHandle = (value: string | number | boolean, index: number, data: any) => {
    setItemUseForRuleDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
      },
      data: data.itemid,
      itemNm: data.itemNm,
    });
  };

  const itemGridColumn: CustomGridColumn[] = useMemo(() => {
    const itemGrid = ITEM_GRID_COLUMN.map((el) => {
      if (el.columeId === 'usedCnt') return { ...el, onClickEvent: onClickCellDialogHandle };
      return el;
    });
    return [
      {
        columeId: 'modify',
        columeName: '수정',
        columeType: 'component',
        textAlign: 'center',
        maxWidth: 50,
      },
      ...itemGrid,
    ];
  }, []);

  // 항목 등록 dialog
  const openDialog = (dialog: Dialogs, data?: ItemMgmt) => {
    setDialogs(dialog);
    setItemListInsertProps({
      open: true,
      onClose: () => {
        setRefreshToken(Date.now);
        closeDialog();
      },
      modifyData: data,
    });
  };
  const closeDialog = () => {
    setDialogs('');
    setItemListInsertProps(undefined);
    setItemUseForRuleDialogProps(undefined);
  };

  return (
    <Box sx={rootSx}>
      <Portlet>
        <PortletContent>
          <SubTitleAndIcon labelTitle="검색" />
          <ItemMgmtHead refreshToken={refreshToken} setItemMgmtData={setItemMgmtData} />
          <Divider sx={{ my: 3 }} />
          <Stack pb={0.5} direction="row" justifyContent="space-between" spacing={2}>
            <SubTitleAndIcon labelTitle="항목 목록" />
            <Button
              startIcon={<AddCircleOutlineIcon />}
              color="success"
              onClick={() => openDialog('itemDialog')}
            >
              신규
            </Button>
          </Stack>
          <SimpleCustomGrid<ItemMgmt>
            sx={{
              height: 300,
            }}
            colums={itemGridColumn}
            rowData={itemMgmtData.map((el) => ({
              ...el,
              modify: (
                <IconButton
                  disabled={!!el.usedCnt && el.usedCnt > 0}
                  sx={{ width: 25, height: 25 }}
                  size="small"
                  onClick={() =>
                    openDialog('itemDialog', {
                      ...el,
                      itemUseYn: el.itemUseYn === '사용' ? 'Y' : 'N',
                      dataTypeCd: dataTypeToCode(el.dataTypeCd ?? ''),
                    })
                  }
                >
                  <ModeEditIcon fontSize="small" />
                </IconButton>
              ),
            }))}
            sortMode
            columeFilterMode
            lineMode
            excelExportMode
            textFilterSelMode
            stickyHeaderMode
            containerRef={(el) => {
              setBodyElement(el);
              tableContainerRef.current = el;
            }}
            rowSelectionEvent={(row) => {
              setSelectedItemId(row);
            }}
            noDataTextMsg="등록된 항목아이템이 없습니다."
          />
          {dialogs === 'itemDialog' && itemListInsertProps && (
            <ItemInsertAndModify {...itemListInsertProps} />
          )}
        </PortletContent>
      </Portlet>
      <Portlet sx={{ mt: 1 }}>
        <PortletContent>
          <ItemMgmtTail itemid={selectedItemId} />
        </PortletContent>
      </Portlet>
      {itemUseForRuleDialogProps && <ItemUseForRuleDialog {...itemUseForRuleDialogProps} />}
    </Box>
  );
}
