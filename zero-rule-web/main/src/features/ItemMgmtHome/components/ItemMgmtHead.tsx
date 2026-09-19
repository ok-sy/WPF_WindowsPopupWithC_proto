import CLDocLabelInput from '@/components/CLDocLabelInput';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';
import type { InterfaceInfoParams } from '@/features/InterfaceMgmtHome/InterfaceMgmtHome';
import errorCustomHandle from '@/lib/error-custom-handle';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import { Box, Button, MenuItem, Stack } from '@mui/material';
import type { ApiRequestContext, InterfaceVo, ItemMgmt } from '@local/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { itemMgmtHeadRootSx } from '../style';
import TextOverField from '@/components/TextOverField';
import { dataTypeToKorNm } from '../static-data';

type Props = {
  setItemMgmtData: (param: ItemMgmt[]) => void;
  refreshToken: number;
};

type itemMgmtSelectParam = {
  itemNm?: string;
  itemAliasNm?: string;
  itemUseYn?: string;
  ifid?: string;
};
const ItemMgmtHead = (props: Props) => {
  const setItemMgmtDataFnRef = useRef<Props['setItemMgmtData']>();
  setItemMgmtDataFnRef.current = props.setItemMgmtData;
  const [itemNm, setItemNm] = useState<string>('');
  const itemNmFnRef = useRef<string>();
  itemNmFnRef.current = itemNm;
  const [itemAliasNm, setItemAliasNm] = useState<string>('');
  const itemAliasNmFnRef = useRef<string>();
  itemAliasNmFnRef.current = itemAliasNm;
  const [itemUseYn, setItemUseYn] = useState<string>('A');
  const itemUseYnFnRef = useRef<string>();
  itemUseYnFnRef.current = itemUseYn;
  const [ifidSelectData, setIfidSelectData] = useState<InterfaceVo[]>([]);
  const [ifid, setIfid] = useState<string>('A');
  const ifidFnRef = useRef<string>();
  ifidFnRef.current = ifid;

  const [pendingSubmitToken, setPendingSubmitToken] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleClickItemMgmtSelectBtn = () => {
    setPendingSubmitToken(Date.now());
  };

  const doReload = useCallback(
    async (ctx: ApiRequestContext, params: itemMgmtSelectParam) => {
      try {
        setLoading(true);
        const listData = await api.itemMgmt.itemMgmtSelect({ ctx, ...params });
        // 아이템id 오름차순정렬
        const sortedListData = listData.body.itemMgmt.sort((a, b) =>
          a.itemid.localeCompare(b.itemid),
        );

        if (ctx.canceled) return false;
        setItemMgmtDataFnRef.current?.(
          sortedListData.map((el) => ({
            ...el,
            itemUseYn: el.itemUseYn === 'Y' ? '사용' : '미사용',
            usedCnt: el.usedCnt === undefined ? 0 : el.usedCnt,
            dataTypeCd: dataTypeToKorNm(el.dataTypeCd ?? ''),
          })),
        );
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api, setItemMgmtDataFnRef],
  );

  const interfaceInfoList = useCallback(
    async (params: InterfaceInfoParams, ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        const { body } = await api.interface.interfaceInfoList({ ctx, ...params });
        setIfidSelectData(body.interfaceInfos);
        if (ctx.canceled) return;
        return body.interfaceInfos;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    const itemUseYnVal = itemUseYnFnRef.current === 'A' ? '' : itemUseYnFnRef.current;
    const ifidVal = ifidFnRef.current === 'A' ? '' : ifidFnRef.current;
    const params: itemMgmtSelectParam = {
      itemNm: itemNmFnRef.current,
      itemAliasNm: itemAliasNmFnRef.current,
      itemUseYn: itemUseYnVal,
      ifid: ifidVal,
    };
    doReload(ctx, params);
    const dataSet = {
      ifid: '',
      ifNm: '',
    };
    //interfaceInfoList(dataSet, ctx)
  }, [
    doReload,
    // interfaceInfoList,
    pendingSubmitToken,
    ifidFnRef,
    itemUseYnFnRef,
    itemNmFnRef,
    itemAliasNmFnRef,
    props.refreshToken,
  ]);

  //화면 진입시 데이터 가져오기
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    const itemUseYnVal = itemUseYnFnRef.current === 'A' ? '' : itemUseYnFnRef.current;
    const ifidVal = ifidFnRef.current === 'A' ? '' : ifidFnRef.current;
    const params: itemMgmtSelectParam = {
      itemNm: itemNmFnRef.current,
      itemAliasNm: itemAliasNmFnRef.current,
      itemUseYn: itemUseYnVal,
      ifid: ifidVal,
    };
    doReload(ctx, params);
    const dataSet = {
      ifid: '',
      ifNm: '',
    };
    doReload(ctx, params);
    interfaceInfoList(dataSet, ctx);
  }, []);

  const handleClickResetBtn = () => {
    setItemNm('');
    setItemAliasNm('');
    setItemUseYn('A');
    setIfid('A');
    setPendingSubmitToken(Date.now());
  };

  return (
    <Box sx={itemMgmtHeadRootSx}>
      <Stack justifyContent="space-between" direction="row" alignItems="center" spacing={0.5}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            '& .CLDocLabelInput-titleBox': {
              minWidth: 100,
              maxWidth: 100,
            },
            '& .CLDocLabelInput-inputBox': {
              minWidth: 150,
              maxWidth: 150,
            },
            '& .CLDocLabelSelect-titleBox': {
              minWidth: 100,
              maxWidth: 100,
            },
          }}
        >
          <CLDocLabelSelect
            title="인터페이스"
            value={ifid}
            onChange={(e) => {
              setIfid(e.target.value as string);
            }}
            sx={{ '& .CLDocLabelSelect-input': { minWidth: 150, maxWidth: 150 } }}
          >
            <MenuItem value="A">전체</MenuItem>
            {ifidSelectData.map((el, idx) => {
              return (
                <MenuItem key={idx} value={el.ifid}>
                  {el.ifNm}({el.ifid})
                </MenuItem>
              );
            })}
          </CLDocLabelSelect>
          <CLDocLabelInput
            title="항목이름"
            value={itemNm}
            onChange={(e) => {
              setItemNm(e.target.value);
            }}
          />
          <CLDocLabelInput
            value={itemAliasNm}
            title="항목별칭"
            onChange={(e) => {
              setItemAliasNm(e.target.value);
            }}
          />
          <CLDocLabelSelect
            title="사용여부"
            defaultValue="A"
            value={itemUseYn}
            onChange={(e) => {
              let val: string = '';
              val = e.target.value as string;
              setItemUseYn(val);
            }}
          >
            <MenuItem value="A">전체</MenuItem>
            <MenuItem value="Y">사용</MenuItem>
            <MenuItem value="N">미사용</MenuItem>
          </CLDocLabelSelect>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={handleClickItemMgmtSelectBtn}>
            검색
          </Button>

          <Button variant="outlined" size="small" onClick={handleClickResetBtn}>
            초기화
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ItemMgmtHead;
