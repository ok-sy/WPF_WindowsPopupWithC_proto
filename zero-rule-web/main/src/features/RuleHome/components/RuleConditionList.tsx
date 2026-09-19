import CLDocTableBody from '@/components/CLDocTableBody/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable/CLStyledTable';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox/CLStyledTableCheckBox';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import {
  CLStyledInputTableCell,
  CLStyledInputTextField,
} from '@/components/TableCellInputText/CLStyledInputTextField';
import TextOverField from '@/components/TextOverField';
import type { ConditionInfixDescDialogProps } from '@/dialogs/ConditionInfixDescDialog';
import ConditionInfixDescDialog from '@/dialogs/ConditionInfixDescDialog';
import type { ReadStateConditionListDialogProps } from '@/dialogs/ReadStateConditionListDialog';
import ReadStateConditionListDialog from '@/dialogs/ReadStateConditionListDialog';
import type { RuleConditionReturnDataUpdDialogProps } from '@/dialogs/RuleConditionReturnDataUpdDialog';
import RuleConditionReturnDataUpdDialog from '@/dialogs/RuleConditionReturnDataUpdDialog';
import { trimAndStringLenght } from '@/lib/common-validation';
import type { ItemMgmt, RuleInfoCondition } from '@local/domain';
import { Button, Stack, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useMemo, useRef, useState } from 'react';

const infoTypeChange = (input: RuleInfoConditionExprSum[]) => {
  const submitArr: RuleInfoCondition[] = [];
  const tmpArr = [...input];

  tmpArr
    .sort((a, b) => a.ruleconditionno - b.ruleconditionno)
    .forEach((el) => {
      el.returnitemExprDesc.forEach((returnVal) => {
        submitArr.push({
          ruleid: el.ruleid,
          itemNm: returnVal.itemNm,
          datatypeCd: returnVal.datatypeCd,
          ruleconditionno: el.ruleconditionno,
          returnitemExprDesc: returnVal.returnitemExprDesc ?? '',
          conditionInfixDesc: el.conditionInfixDesc,
          conditionDesc: el.conditionDesc,
          uptGubun: el.uptGubun,
          returnItemid: returnVal.returnItemid,
        });
      });
    });
  return submitArr;
};

export interface RuleInfoConditionExprSum {
  ruleid?: string; //룰아이디
  ruleconditionno: number; //조건식번호
  conditionInfixDesc: string; //중위식조건
  conditionDesc: string; //설명
  uptGubun?: string; // 룰관리 수정구분 화면에서 적용
  returnItemid?: string;
  returnitemExprDesc: {
    itemNm: string;
    returnItemid: string;
    returnitemExprDesc?: string;
    datatypeCd: string;
    ruleconditionno?: number;
  }[]; // 반환값
}

type Props = {
  asisData?: RuleInfoCondition[];
  ruleReturnData: ItemMgmt[];
  readChecked: boolean;
  onSubmitData: (data: RuleInfoCondition[]) => void;
  ifid: string;
};

type DialogParams =
  | {
      id: 'RuleConditionReturnDataUpdDialog';
      props: RuleConditionReturnDataUpdDialogProps;
    }
  | {
      id: 'ConditionInfixDescDialog';
      props: ConditionInfixDescDialogProps;
    }
  | {
      id: 'ReadStateConditionListDialog';
      props: ReadStateConditionListDialogProps;
    };

export default function RuleConditionList(props: Props) {
  const { asisData, readChecked, ruleReturnData, onSubmitData, ifid } = props;
  const onSubmitDataFnRef = useRef<Props['onSubmitData']>();
  onSubmitDataFnRef.current = onSubmitData;
  const [selectChecked, setSelectChecked] = useState<number[]>([]);
  const [dialogParams, setDialogParams] = useState<DialogParams>();
  const viewData = useMemo(() => {
    if (!asisData) return;
    const tmpArr = [...asisData];
    const resultArr: RuleInfoConditionExprSum[] = [];
    tmpArr.forEach((el, idx, arr) => {
      if (resultArr.filter((inClEl) => inClEl.ruleconditionno === el.ruleconditionno).length > 0) {
        return;
      }
      const filteringArr = arr.filter((arrEl) => arrEl.ruleconditionno === el.ruleconditionno);
      resultArr.push({
        ruleid: filteringArr[0].ruleid ?? '0',
        ruleconditionno: filteringArr[0].ruleconditionno,
        conditionInfixDesc: filteringArr[0].conditionInfixDesc,
        conditionDesc: filteringArr[0].conditionDesc,
        uptGubun: filteringArr[0].uptGubun,
        returnItemid: filteringArr[0].returnItemid,
        returnitemExprDesc: filteringArr.map((mapEl) => ({
          datatypeCd: mapEl.datatypeCd,
          itemNm: mapEl.itemNm,
          returnitemExprDesc: mapEl.returnitemExprDesc,
          returnItemid: mapEl.returnItemid,
          ruleconditionno: mapEl.ruleconditionno,
        })),
      });
    });
    return resultArr;
  }, [asisData]);

  const openDialog = (
    data: {
      itemNm: string;
      returnItemid: string;
      returnitemExprDesc?: string;
      datatypeCd: string;
    }[],
    idx: number,
  ) => {
    setDialogParams({
      id: 'RuleConditionReturnDataUpdDialog',
      props: {
        open: true,
        onClose: () => {
          setDialogParams(undefined);
        },
        data,
        onSubmit: (changeData) => {
          if (!viewData) return;
          const tmpArr = [...viewData];
          if (viewData[idx].uptGubun === 'C') {
            tmpArr.splice(idx, 1, { ...viewData[idx], returnitemExprDesc: changeData });
          } else {
            tmpArr.splice(idx, 1, {
              ...viewData[idx],
              returnitemExprDesc: changeData,
              uptGubun: 'U',
            });
          }

          onSubmitData(infoTypeChange(tmpArr));
        },
      },
    });
  };

  const handleClickAddCell = () => {
    if (!viewData) return;

    console.log('asisDataasisData', asisData);
    const tmpArr = ruleReturnData
      .filter((el) => el.uptGubun !== 'D')
      .map((item) => {
        const newCell = {
          ruleid: viewData[0]?.ruleid ?? '0',
          ruleconditionno: viewData.length + 1,
          uptGubun: 'C',
          itemNm: item.itemNm ?? '',
          datatypeCd: item.dataTypeCd ?? '',
          returnitemExprDesc: '',
          returnItemid: item.itemid,
          conditionDesc: '',
          conditionInfixDesc: '',
        };
        return newCell;
      });
    if (asisData === undefined) {
      onSubmitData([...tmpArr]);
    } else {
      onSubmitData([...asisData, ...tmpArr]);
    }
  };

  const handleInputChange =
    (index: number, field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      if (!viewData) return;
      const changeArr = viewData.map((item, idx) => {
        if (item.uptGubun === 'C') {
          return idx === index ? { ...item, [field]: newValue } : item;
        }
        {
          return idx === index ? { ...item, [field]: newValue, uptGubun: 'U' } : item;
        }
      });
      onSubmitData(infoTypeChange(changeArr));
    };

  // 전체선택
  const allRowCheckHandler = (checked: boolean) => {
    if (checked) {
      viewData?.map((el) => {
        setSelectChecked(viewData?.map((el) => el.ruleconditionno));
      });
    } else {
      setSelectChecked([]);
    }
  };

  // 단일선택
  const checkHandle = (fildId: number, checked: boolean) => {
    if (checked) {
      setSelectChecked((p) => [...p, fildId]);
    } else {
      setSelectChecked((prevState) => prevState.filter((item) => item !== fildId));
    }
  };

  // 삭제버튼
  const handleClickDel = () => {
    const updatedData = viewData?.map((item) => {
      if (selectChecked.includes(item.ruleconditionno)) {
        return {
          ...item,
          uptGubun: 'D',
        };
      }
      return item;
    });
    if (updatedData === undefined) return;
    onSubmitData(infoTypeChange(updatedData));
  };

  //conditionInfixDesc
  const openConditionInfixDescDialog = (val: string, idx: number) => {
    setDialogParams({
      id: 'ConditionInfixDescDialog',
      props: {
        open: true,
        onClose: () => {
          setDialogParams(undefined);
        },
        onSubmit: (data) => {
          if (!viewData) return;
          const tmpArr = [...viewData];
          console.log('tmpArr[idx]tmpArr[idx]tmpArr[idx]', tmpArr[idx]);
          if (val !== data && tmpArr[idx].uptGubun !== 'C') {
            tmpArr.splice(idx, 1, { ...viewData[idx], conditionInfixDesc: data, uptGubun: 'U' });
          } else {
            tmpArr.splice(idx, 1, { ...viewData[idx], conditionInfixDesc: data });
          }
          onSubmitData(infoTypeChange(tmpArr));
          setDialogParams(undefined);
        },
        val: val,
        ifid: ifid,
      },
    });
  };

  // 읽기모드 시 조건식 리스트 팝업
  const openReadStateConditionList = (selIdx: number) => {
    if (!viewData) return;

    setDialogParams({
      id: 'ReadStateConditionListDialog',
      props: {
        open: true,
        onClose: () => {
          setDialogParams(undefined);
        },
        selIdx: selIdx,
        data: viewData,
      },
    });
  };

  return (
    <Stack className="RuleConditionList-root">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <SubTitleAndIcon labelTitle="조건식 리스트" />
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClickAddCell}
            disabled={readChecked}
          >
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
          height: 300,
          border: '1px solid #e0e0e0',
          whiteSpace: 'nowrap',
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
              width: 150,
              maxWidth: 150,
              textAlign: 'center',
            },
            '&:nth-of-type(5)': {
              width: 400,
              maxWidth: 400,
            },
            '&:nth-of-type(6)': {
              width: 350,
              maxWidth: 350,
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
              <TableCell>반환값</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>조건식</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>설명</TableCell>
            </TableRow>
          </CustomColoredTableHead>
          <CLDocTableBody yPadding="small">
            {viewData
              ?.filter((el) => el.uptGubun !== 'D')
              .map((el, idx) => {
                const {
                  uptGubun,
                  conditionDesc,
                  conditionInfixDesc,
                  ruleconditionno,
                  returnitemExprDesc,
                } = el;
                return (
                  <TableRow
                    onClick={() => {
                      if (readChecked) {
                        openReadStateConditionList(idx);
                      }
                    }}
                    sx={{
                      '& .MuiTableCell-root': {
                        borderRight: '1px solid #e0e0e0',
                      },
                    }}
                    key={idx}
                  >
                    <TableCell align="center">
                      <CLStyledTableCheckBox
                        disabled={readChecked}
                        onChange={(e, checked) => {
                          checkHandle(el.ruleconditionno, checked);
                        }}
                        checked={selectChecked.includes(el.ruleconditionno)}
                      />
                    </TableCell>
                    <TableCell sx={{ cursor: readChecked ? 'pointer' : 'auto' }}>
                      <Typography textAlign="center">{uptGubun ?? 'R'}</Typography>
                    </TableCell>
                    <TableCell sx={{ cursor: readChecked ? 'pointer' : 'auto' }}>
                      <Typography textAlign="center">{idx + 1}</Typography>
                    </TableCell>
                    <TableCell
                      onClick={() => !readChecked && openDialog(el.returnitemExprDesc, idx)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Typography textAlign="left">
                        {returnitemExprDesc.map((el, descIdx) => {
                          if (trimAndStringLenght(el.returnitemExprDesc) < 1) {
                            return <></>;
                          }
                          return (
                            <span key={descIdx}>
                              {descIdx + 1 > 1 && ':_:'}
                              {el.returnitemExprDesc}
                            </span>
                          );
                        })}
                      </Typography>
                    </TableCell>
                    <CLStyledInputTableCell
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (!readChecked) {
                          openConditionInfixDescDialog(conditionInfixDesc, idx);
                        }
                      }}
                    >
                      <TextOverField maxWidth={450} text={conditionInfixDesc} textAlign="left" />
                    </CLStyledInputTableCell>
                    <CLStyledInputTableCell sx={{ cursor: readChecked ? 'pointer' : 'auto' }}>
                      <Typography textAlign="left">
                        <CLStyledInputTextField
                          variant="outlined"
                          readOnly={readChecked}
                          fullWidth
                          value={conditionDesc ?? ''}
                          onChange={handleInputChange(idx, 'conditionDesc')}
                        />
                      </Typography>
                    </CLStyledInputTableCell>
                  </TableRow>
                );
              })}
          </CLDocTableBody>
        </CLStyledTable>
      </TableContainer>
      {dialogParams?.id === 'RuleConditionReturnDataUpdDialog' && (
        <RuleConditionReturnDataUpdDialog {...dialogParams?.props} />
      )}
      {dialogParams?.id === 'ConditionInfixDescDialog' && (
        <ConditionInfixDescDialog {...dialogParams?.props} />
      )}
      {dialogParams?.id === 'ReadStateConditionListDialog' && (
        <ReadStateConditionListDialog {...dialogParams?.props} />
      )}
    </Stack>
  );
}
