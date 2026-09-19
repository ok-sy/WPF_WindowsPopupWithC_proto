import CLDocTableBody from '@/components/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import type { RuleReturnItemAddListDialogProps } from '@/dialogs/RuleReturnItemAddListDialog';
import RuleReturnItemAddListDialog from '@/dialogs/RuleReturnItemAddListDialog';
import type { ItemMgmt } from '@local/domain';
import {} from '@local/ui';
import type { SxProps } from '@mui/material';
import { Button, Stack, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
const rootSx: SxProps = {};
type Props = {
  asisData?: ItemMgmt[];
  readChecked: boolean;
  onSubmitData: (data: ItemMgmt[]) => void;
  ifid: string;
};
type DialogIds = 'RuleReturnItemAddListDialog';
export default function RuleReturnList(props: Props) {
  const { asisData, readChecked, onSubmitData, ifid } = props;
  const onSubmitDataFnRef = useRef<Props['onSubmitData']>();
  onSubmitDataFnRef.current = onSubmitData;
  const [dialodId, setDialodId] = useState<DialogIds>();
  const [ruleReturnItemAddListDialogProps, setRuleReturnItemAddListDialogProps] =
    useState<RuleReturnItemAddListDialogProps>();
  const [selectChecked, setSelectChecked] = useState<string[]>([]);

  const yetReturnListData = useMemo(() => {
    if (!asisData) return;
    return asisData;
  }, [asisData]);

  const handleCloseDialog = () => {
    setDialodId(undefined);
    setRuleReturnItemAddListDialogProps(undefined);
  };

  const openDialog = () => {
    setDialodId('RuleReturnItemAddListDialog');
    setRuleReturnItemAddListDialogProps({
      open: true,
      onClose: () => {
        handleCloseDialog();
      },
      ifid: ifid,
      onSubmit: (data) => {
        if (!yetReturnListData) return;
        const dataSet = {
          itemid: data.itemid,
          itemNm: data.itemNm,
          itemAliasNm: data.itemAliasNm,
          itemExplanDesc: data.itemExplanDesc,
          dataTypeCd: data.dataTypeCd,
          dataTypeNm: data.dataTypeNm,
          updateUserId: data.updateUserID,
          updateDateTime: data.updateDateTime,
          itemUseYn: data.itemUseYn,
          firstRegUserid: data.updateUserID,
          firstRegDateTime: data.firstRegDateTime,
          uptGubun: 'C',
        };
        const insertDuplicate = yetReturnListData.some((el) => el.itemid === dataSet.itemid);
        const delDuplicate = yetReturnListData.some(
          (el) => el.itemid === dataSet.itemid && el.uptGubun === 'D',
        );
        if (!insertDuplicate) {
          const addArr = [...yetReturnListData, dataSet];
          return onSubmitData(addArr);
        } else if (delDuplicate) {
          const index = yetReturnListData.findIndex((el) => el.itemid === dataSet.itemid);
          yetReturnListData[index].uptGubun = 'C';
          return onSubmitData([...yetReturnListData]);
        } else {
          return toast.warning('이미 존재하는 항목입니다.');
        }
      },
    });
  };

  const allRowCheckHandler = (checked: boolean) => {
    if (checked) {
      console.log('true');
      yetReturnListData?.map((el) => {
        setSelectChecked(yetReturnListData?.map((el) => el.itemid));
      });
    } else {
      console.log('false');
      setSelectChecked([]);
    }
  };

  const checkHandle = (fildId: string, checked: boolean) => {
    if (checked) {
      setSelectChecked((p) => [...p, fildId]);
    } else {
      setSelectChecked((prevState) => prevState.filter((item) => item !== fildId));
    }
  };

  const handleClickDel = () => {
    if (!yetReturnListData) return;
    const updatedData = yetReturnListData.map((item) => {
      if (selectChecked.includes(item.itemid)) {
        return {
          ...item,
          uptGubun: 'D',
        };
      }
      return item;
    });
    onSubmitData(updatedData);

    setSelectChecked([]);
  };

  return (
    <Stack sx={rootSx} className="RuleReturnList-root">
      <Stack direction={'row'} justifyContent="space-between" alignItems="center">
        <SubTitleAndIcon labelTitle="룰 반환 리스트" />
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Button variant="outlined" size="small" onClick={openDialog} disabled={readChecked}>
            추가
          </Button>
          <Button variant="outlined" size="small" onClick={handleClickDel} disabled={readChecked}>
            삭제
          </Button>
        </Stack>
      </Stack>
      <TableContainer
        sx={{
          mt: 0.5,
          height: 200,
          border: '1px solid #e0e0e0',
          '& .MuiTypography-root': {
            fontSize: '0.75rem',
          },
          '& .MuiTableCell-root': {
            px: 1,
            '&:nth-of-type(1)': {
              width: 40,
              maxWidth: 40,
            },
            '&:nth-of-type(2)': {
              whiteSpace: 'nowrap',
              width: 80,
              maxWidth: 80,
              textAlign: 'center',
            },
            '&:nth-of-type(3)': {
              whiteSpace: 'nowrap',
              width: 70,
              maxWidth: 70,
              textAlign: 'center',
            },
            '&:nth-of-type(4)': {
              whiteSpace: 'nowrap',
              width: 200,
              maxWidth: 200,
              textAlign: 'center',
            },
            '&:nth-of-type(5)': {
              whiteSpace: 'nowrap',
              textAlign: 'center',
            },
            '&:nth-of-type(6)': {
              whiteSpace: 'nowrap',
              width: 90,
              maxWidth: 90,
              textAlign: 'center',
            },
          },
        }}
      >
        <CLStyledTable noMargin>
          <CustomColoredTableHead yPadding="small">
            <TableRow>
              <TableCell>
                <CLStyledTableCheckBox
                  disabled={readChecked}
                  onChange={(_, checked) => {
                    allRowCheckHandler(checked);
                  }}
                />
              </TableCell>
              <TableCell>수정구분</TableCell>
              <TableCell>순서</TableCell>
              <TableCell>반환항목명</TableCell>
              <TableCell>반환항목별칭</TableCell>
              <TableCell>데이터타입</TableCell>
            </TableRow>
          </CustomColoredTableHead>
          <CLDocTableBody yPadding="small">
            {yetReturnListData
              ?.filter((el) => el.uptGubun !== 'D')
              .map((el, idx) => {
                const { uptGubun, itemNm, itemAliasNm, dataTypeNm } = el;
                return (
                  <TableRow
                    key={idx}
                    sx={{ '& .MuiTableCell-root': { borderRight: '1px solid #e0e0e0' } }}
                  >
                    <TableCell>
                      <CLStyledTableCheckBox
                        disabled={readChecked}
                        onChange={(e, checked) => {
                          checkHandle(el.itemid, checked);
                        }}
                        checked={selectChecked.includes(el.itemid)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="center">{uptGubun ?? 'R'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="center">{idx + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="left">{itemNm}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="left">{itemAliasNm}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography textAlign="center">{dataTypeNm}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
          </CLDocTableBody>
        </CLStyledTable>
      </TableContainer>

      {dialodId === 'RuleReturnItemAddListDialog' && ruleReturnItemAddListDialogProps && (
        <RuleReturnItemAddListDialog {...ruleReturnItemAddListDialogProps} />
      )}
    </Stack>
  );
}
