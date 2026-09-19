import CLDocTableBody from '@/components/CLDocTableBody';
import CLStyledTable from '@/components/CLStyledTable';
import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import { CustomDialogTitle, CustomDragableDialog } from '@local/ui';
import {
  Button,
  DialogActions,
  DialogContent,
  SxProps,
  TableCell,
  TableContainer,
  TableRow,
  Theme,
  Typography,
} from '@mui/material';
import HstRuleInfo from './components/HstRuleInfo';
import { rootSx } from './style';
import type { RuleVerstionData } from '@local/domain';

export type RuleInfoHstDialogProps = {
  open: boolean;
  onClose: () => void;
  data: RuleVerstionData;
  ifNm: string;
};

export default function RuleInfoHstDialog(props: RuleInfoHstDialogProps) {
  const { open, onClose, data, ifNm } = props;
  return (
    <CustomDragableDialog
      maxWidth="lg"
      fullWidth
      backLightOn
      className="RuleInfoHstDialog-root"
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
      <CustomDialogTitle title="상세 이력" onClose={onClose}></CustomDialogTitle>

      <DialogContent
        dividers
        className="RuleInfoHstDialog-content"
        sx={{ py: 1, px: 2, minHeight: 300 }}
      >
        {/* 룰 항목 */}
        <HstRuleInfo data={data} ifNm={ifNm} />
        {/* 반환리스트 항목 */}
        <TableContainer className="RuleInfoHstDialog-returnitem-table">
          <CLStyledTable noMargin>
            <CustomColoredTableHead yPadding="small">
              <TableRow>
                <TableCell>순서</TableCell>
                <TableCell>반환항목명</TableCell>
                <TableCell>반환항목별칭</TableCell>
                <TableCell>데이터타입</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            <CLDocTableBody yPadding="small">
              {data.ruleReturnItemVerstion
                ?.filter((el) => el.ruleVerno === data.ruleVerno)
                .map((el, idx) => {
                  // const { uptGubun, itemNm, itemAliasNm, dataTypeNm } = el
                  return (
                    <TableRow
                      key={el.ruleVerno}
                      sx={{ '& .MuiTableCell-root': { borderRight: '1px solid #e0e0e0' } }}
                    >
                      <TableCell>
                        <Typography textAlign="center">{el.returnitemNo}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography textAlign="left" sx={{ fontSize: '0.75rem' }}>
                          {el.itemNm}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography textAlign="left" sx={{ fontSize: '0.75rem' }}>
                          {el.itemaliasNm}
                        </Typography>
                      </TableCell>
                      {/* 데이터 타입 */}
                      <TableCell>{el.datatypeNm}</TableCell>
                    </TableRow>
                  );
                })}
            </CLDocTableBody>
          </CLStyledTable>
        </TableContainer>
        {/* 조건식리스트 항목 */}
        <TableContainer
          className="RuleInfoHstDialog-condition-table"
          sx={{
            '& .MuiTableCell-root': {
              '&:nth-of-type(1)': {
                width: 40,
                maxWidth: 40,
              },

              '&:nth-of-type(2)': {
                width: 150,
                maxWidth: 150,
                textAlign: 'center',
              },
              '&:nth-of-type(3)': {
                width: 400,
                maxWidth: 400,
              },
              '&:nth-of-type(4)': {
                width: 350,
                maxWidth: 350,
              },
            },
          }}
        >
          <CLStyledTable noMargin>
            <CustomColoredTableHead yPadding="small">
              <TableRow>
                <TableCell>순서</TableCell>
                <TableCell>반환값</TableCell>
                <TableCell>중위식조건</TableCell>
                <TableCell>설명</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            <CLDocTableBody yPadding="small">
              {data.ruleConditionVerstion
                ?.filter((el) => el.ruleVerno === data.ruleVerno)
                .map((el, idx) => {
                  return (
                    <TableRow
                      sx={{ '& .MuiTableCell-root': { borderRight: '1px solid #e0e0e0' } }}
                      key={el.ruleVerno}
                    >
                      <TableCell>{el.ruleconditionno}</TableCell>
                      <TableCell>
                        <Typography textAlign="left" sx={{ fontSize: '0.75rem' }}>
                          {el.resultValue}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography textAlign="left" sx={{ fontSize: '0.75rem' }}>
                          {el.conditionInfixDesc}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography textAlign="left" sx={{ fontSize: '0.75rem' }}>
                          {el.conditionDesc ?? ''}
                        </Typography>
                      </TableCell>
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
