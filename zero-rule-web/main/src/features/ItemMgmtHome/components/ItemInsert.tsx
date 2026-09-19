import CLDocLabelAny from '@/components/CLDocLabelAny';
import CLDocLabelInput from '@/components/CLDocLabelInput';
import CLDocLabelSelect from '@/components/CLDocLabelSelect';
import CLStyledFormControlLabel from '@/components/CLStyledFormControlLabel';
import type { InterfaceInfoParams } from '@/features/InterfaceMgmtHome/InterfaceMgmtHome';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { pstring } from '@cp949/pjs';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CustomDialog,
  CustomDialogTitle,
  isEnterOrTabKeyEvent,
  requestFocusSelector,
} from '@local/ui';
import { Button, DialogContent, MenuItem, Radio, RadioGroup, Stack } from '@mui/material';
import type { ApiRequestContext, InterfaceVo, ItemMgmt } from '@local/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { ItemInsertForm } from './insert-form-schema';
import { insertFormSchema } from './insert-form-schema';

export type ItemInsertProps = {
  open: boolean;
  onClose: () => void;
  modifyData?: ItemMgmt;
};
// 항목저장버튼 클릭시 Object에 담을 타입
type ItemInsertRadio = {
  dataTypeCd: string;
  itemUseYn: string;
};

type ItemInsertParam = {
  itemNm: string;
  itemAliasNm: string;
  itemExplanDesc: string;
  dataTypeCd: string;
  itemUseYn: string;
  ifid: string;
};

export default function ItemInsertAndModify(props: ItemInsertProps) {
  const { open, onClose, modifyData } = props;
  const rootRef = useRef<HTMLElement>();
  const api = useApi();
  const [loading, setLoading] = useState<boolean>(false);
  // 입력 요소 state
  const [itemRadio, setItemRadio] = useState<ItemInsertRadio>({
    dataTypeCd: '',
    itemUseYn: '',
  });
  const [ifidSelectData, setIfidSelectData] = useState<InterfaceVo[]>([]);
  const [ifid, setIfid] = useState<string>('');
  // 입력 요소들의 변경 핸들러 함수
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItemRadio({
      ...itemRadio,
      [name]: value,
    });
  };
  const doSave = useCallback(
    async (params: ItemInsertParam): Promise<number | null> => {
      try {
        setLoading(true);
        const body = await api.itemMgmt.itemMgmtinsert({ ...params });
        if (body.body.insertCnt > 0) {
          toast.success('정상 등록 되었습니다.');
          return body.body.insertCnt;
        }
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [api],
  );
  const doModify = useCallback(
    async (params: ItemInsertParam, itemid: string): Promise<number | null> => {
      try {
        setLoading(true);
        const body = await api.itemMgmt.itemMgmtModify({ itemid: itemid, ...params });
        if (body.body.insertCnt > 0) {
          toast.success('정상 수정 되었습니다.');
          return body.body.insertCnt;
        }
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [api],
  );
  // 저장된함수
  const onSubmit = (data: ItemInsertForm) => {
    if (itemRadio.dataTypeCd === '') return;
    if (itemRadio.itemUseYn === '') return;
    const sendApiData = {
      ...data,
      ...itemRadio,
      ifid: ifid,
    };
    doSave({ ...sendApiData }).then((result) => {
      if (result) {
        onClose();
      }
    });
  };

  const onSubmitModify = (data: ItemInsertForm) => {
    if (modifyData?.itemid === undefined) return;

    if (itemRadio.dataTypeCd === '') return;
    if (itemRadio.itemUseYn === '') return;
    const sendApiData = {
      ...data,
      ...itemRadio,
      ifid: ifid,
    };
    doModify({ ...sendApiData }, modifyData.itemid).then((result) => {
      if (result) {
        onClose();
      }
    });
  };

  const formConfig = useForm<ItemInsertForm>({
    resolver: yupResolver(insertFormSchema),
    mode: 'all',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const focus = useCallback((selector: string) => {
    requestFocusSelector(rootRef.current, selector, 0);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = formConfig;
  const canSubmit =
    isValid && !isSubmitting && itemRadio.dataTypeCd !== '' && itemRadio.itemUseYn !== '';
  const canEdit = !isSubmitting;
  useEffect(() => {
    if (props.modifyData === undefined) return;
    const value = {};
    setValue('itemAliasNm', props.modifyData.itemAliasNm ?? '');
    setValue('itemExplanDesc', props.modifyData.itemExplanDesc ?? '');
    setValue('itemNm', props.modifyData.itemNm ?? '');
    setIfid(props.modifyData.ifid ?? '');
    setItemRadio({
      dataTypeCd: props.modifyData.dataTypeCd ?? '',
      itemUseYn: props.modifyData.itemUseYn ?? '',
    });
  }, [props.modifyData, setValue]);
  const interfaceInfoList = useCallback(
    async (params: InterfaceInfoParams, ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        const { body } = await api.interface.interfaceInfoList({ ctx, ...params });
        setIfidSelectData(body.interfaceInfos);
        if (!props.modifyData) {
          setIfid(body.interfaceInfos[0].ifid);
        }
        if (ctx.canceled) return;
        return body.interfaceInfos;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [api, props.modifyData],
  );
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    const dataSet = {
      ifid: '',
      ifNm: '',
    };
    interfaceInfoList(dataSet, ctx);
  }, [interfaceInfoList]);
  return (
    <CustomDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <CustomDialogTitle title={modifyData === undefined ? '항목 등록' : `항목 수정`} />
      <DialogContent dividers ref={rootRef}>
        <Stack
          spacing={2}
          sx={{ '& .mui-style-dmmspl-MuiFormGroup-root': { flexDirection: 'row' } }}
        >
          <CLDocLabelInput
            title="항목ID"
            placeholder="항목ID"
            readOnly
            value={props.modifyData?.itemid ?? ''}
            sx={{ marginRight: 1, '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' } }}
          />
          <CLDocLabelInput
            {...register('itemNm')}
            error={!!errors.itemNm}
            helperText={errors.itemNm?.message}
            disabled={!canEdit}
            onKeyDown={(e) => {
              if (isEnterOrTabKeyEvent(e)) {
                const value = (e.target as HTMLInputElement).value;
                if (pstring.isNotBlank(value)) {
                  e.preventDefault();
                  focus('input[name=itemAliasNm]');
                }
              }
            }}
            title="항목이름"
            placeholder="항목이름"
            name="itemNm"
            sx={{ marginRight: 1, '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' } }}
          />
          <CLDocLabelInput
            {...register('itemAliasNm')}
            error={!!errors.itemAliasNm}
            helperText={errors.itemAliasNm?.message}
            disabled={!canEdit}
            title="항목 별칭"
            placeholder="항목 별칭"
            name="itemAliasNm"
            onKeyDown={(e) => {
              if (isEnterOrTabKeyEvent(e)) {
                const value = (e.target as HTMLInputElement).value;
                if (pstring.isNotBlank(value)) {
                  e.preventDefault();
                  focus('input[name=itemExplanDesc]');
                }
              }
            }}
            sx={{ marginRight: 1, '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' } }}
          />
          <CLDocLabelInput
            {...register('itemExplanDesc')}
            error={!!errors.itemExplanDesc}
            helperText={errors.itemExplanDesc?.message}
            disabled={!canEdit}
            onKeyDown={(e) => {
              if (isEnterOrTabKeyEvent(e)) {
                const value = (e.target as HTMLInputElement).value;
                if (pstring.isNotBlank(value)) {
                  e.preventDefault();
                  focus('.radio-datatype');
                }
              }
            }}
            title="항목 설명"
            placeholder="항목 설명"
            name="itemExplanDesc"
            sx={{ marginRight: 1, '& .CLDocLabelInput-titleBox': { backgroundColor: 'white' } }}
          />
          <CLDocLabelAny
            title="데이터타입"
            sx={{ '& .CLDocLabelAny-titleBox': { backgroundColor: 'white' } }}
          >
            <RadioGroup
              className="radio-datatype"
              name="dataTypeCd"
              value={itemRadio.dataTypeCd}
              onChange={handleChange}
            >
              <CLStyledFormControlLabel value="0" control={<Radio />} label="숫자형" />
              <CLStyledFormControlLabel value="1" control={<Radio />} label="문자형" />
              <CLStyledFormControlLabel value="2" control={<Radio />} label="논리형" />
            </RadioGroup>
          </CLDocLabelAny>
          <CLDocLabelAny
            title="사용여부"
            sx={{ '& .CLDocLabelAny-titleBox': { backgroundColor: 'white' } }}
          >
            <RadioGroup name="itemUseYn" value={itemRadio.itemUseYn} onChange={handleChange}>
              <CLStyledFormControlLabel value="Y" control={<Radio />} label="사용" />
              <CLStyledFormControlLabel value="N" control={<Radio />} label="미사용" />
            </RadioGroup>
          </CLDocLabelAny>
          <CLDocLabelSelect
            title="인터페이스"
            value={ifid}
            onChange={(e) => {
              setIfid(e.target.value as string);
            }}
            sx={{ marginRight: 1, '& .CLDocLabelSelect-titleBox': { backgroundColor: 'white' } }}
          >
            {ifidSelectData.map((el, idx) => {
              return (
                <MenuItem key={idx} value={el.ifid}>
                  {el.ifNm}({el.ifid})
                </MenuItem>
              );
            })}
          </CLDocLabelSelect>
        </Stack>
      </DialogContent>
      <Stack spacing={1} direction="row" justifyContent="flex-end" sx={{ margin: '10px' }}>
        {modifyData === undefined ? (
          <Button
            size="small"
            variant="contained"
            disabled={!canSubmit}
            onClick={handleSubmit(onSubmit)}
          >
            저장
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            disabled={!canSubmit}
            onClick={handleSubmit(onSubmitModify)}
          >
            수정
          </Button>
        )}

        <Button size="small" variant="contained" onClick={onClose}>
          닫기
        </Button>
      </Stack>
    </CustomDialog>
  );
}
