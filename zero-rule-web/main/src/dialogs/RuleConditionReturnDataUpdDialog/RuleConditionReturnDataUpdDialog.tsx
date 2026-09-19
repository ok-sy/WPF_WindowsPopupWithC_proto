import CLCodeListLabel from '@/components/CLCodeListLabel';
import CLDocTableBody from '@/components/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import { conditionPopupValid } from '@/features/RuleHome/rule-valid';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import { CustomDialogTitle, CustomDragableDialog } from '@local/ui';
import type { SxProps, Theme } from '@mui/material';
import {
  Button,
  DialogActions,
  DialogContent,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
const rootSx: SxProps<Theme> = (theme) => ({
  '& .CLDocLabelInput-root': {
    '& .CLDocLabelInput-titleBox': {
      minWidth: 80,
      maxWidth: 80,
    },
  },
});

export type RuleConditionReturnDataUpdDialogProps = {
  open: boolean;
  onClose: () => void;
  data: {
    itemNm: string;
    returnItemid: string;
    returnitemExprDesc?: string;
    datatypeCd: string;
    ruleconditionno?: number;
  }[];
  onSubmit: (
    data: {
      itemNm: string;
      returnItemid: string;
      returnitemExprDesc?: string;
      datatypeCd: string;
      ruleconditionno?: number;
    }[],
  ) => void;
};

export default function RuleConditionReturnDataUpdDialog(
  props: RuleConditionReturnDataUpdDialogProps,
) {
  const { open, onClose, data, onSubmit } = props;
  const api = useApi();
  const [updatedData, setUpdatedData] = useState(data.map((el) => ({ ...el })));

  const descValid = useCallback(
    async (
      params: {
        itemNm: string;
        returnItemid: string;
        returnitemExprDesc?: string;
        datatypeCd: string;
        ruleconditionno?: number;
      }[],
    ) => {
      try {
        const { body } = await api.rule.ruleReturnConditionValid({ ruleInfoCondition: params });
        return body.result;
      } catch (err) {
        errorCustomHandle(err);
      }
      return null;
    },
    [api],
  );
  const handleClickUptBtn = () => {
    const isValid = conditionPopupValid(updatedData);
    descValid(updatedData).then((result) => {
      if (result !== 'N') {
        if (isValid) {
          onSubmit(updatedData);
          onClose();
        }
      } else {
        toast.warn('조건에 맞게 작성되지 않았습니다');
      }
    });
  };
  return (
    <CustomDragableDialog
      maxWidth="sm"
      fullWidth
      backLightOn
      className="RuleConditionReturnDataUpdDialog-root"
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
      <CustomDialogTitle title="반환값 등록/수정" onClose={onClose}></CustomDialogTitle>

      <DialogContent
        dividers
        className="RuleConditionReturnDataUpdDialog-content"
        sx={{ p: 0, minHeight: 300 }}
      >
        <TableContainer>
          <CLStyledTable noMargin sx={{ whiteSpace: 'nowrap' }}>
            <CustomColoredTableHead yPadding="small">
              <TableRow>
                <TableCell>반환항목명</TableCell>
                <TableCell>데이터타입</TableCell>
                <TableCell>반환값</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            <CLDocTableBody yPadding="small">
              {updatedData.map((el, idx) => {
                const { datatypeCd, itemNm, returnItemid, returnitemExprDesc } = el;
                return (
                  <TableRow key={returnItemid}>
                    <TableCell>{itemNm}</TableCell>
                    <TableCell>
                      <CLCodeListLabel code={datatypeCd} codeType="102" onChange={(e) => {}} />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={returnitemExprDesc}
                        onChange={(e) => {
                          const updatedItem = {
                            ...el,
                            returnitemExprDesc: String(e.target.value),
                          };
                          const updatedList = [...updatedData];
                          updatedList[idx] = updatedItem;
                          setUpdatedData(updatedList);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleClickUptBtn}>
          저장
        </Button>
        <Button variant="contained" onClick={onClose}>
          취소
        </Button>
      </DialogActions>
    </CustomDragableDialog>
  );
}
