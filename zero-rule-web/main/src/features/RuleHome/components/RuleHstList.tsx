import CLDocTableBody from '@/components/CLDocTableBody';
import CLDocTableHead from '@/components/CLDocTableHead';
import CLStyledTable from '@/components/CLStyledTable';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import type { RuleInfoHstDialogProps } from '@/dialogs/RuleInfoHstDialog';
import RuleInfoHstDialog from '@/dialogs/RuleInfoHstDialog';
import type { SxProps } from '@mui/material';
import { Stack, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import type { RuleVerstionData } from '@local/domain';
import { useState } from 'react';
import { hstChangeCode } from '../rule-code';
import { trimAndStringLenght } from '@/lib/common-validation';

const rootSx: SxProps = {};

type DialogIds = 'RuleInfoHstDialog';
type Props = {
  data: RuleVerstionData[];
  ifNm: string;
};
export default function RuleHstList(props: Props) {
  const { data, ifNm } = props;
  const [dialogId, setDialogId] = useState<DialogIds>();
  const [ruleInfoHstDialogProps, setRuleInfoHstDialogProps] = useState<RuleInfoHstDialogProps>();

  const closeDialog = () => {
    setDialogId(undefined);
    setRuleInfoHstDialogProps(undefined);
  };

  const openDialog = (data: RuleVerstionData) => {
    setDialogId('RuleInfoHstDialog');
    setRuleInfoHstDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
      },
      data,
      ifNm,
    });
  };

  return (
    <Stack sx={rootSx} className="RuleHstList-root">
      <SubTitleAndIcon sx={{ mb: 0.5 }} labelTitle="변경이력" />
      <TableContainer
        sx={{
          mt: 0.5,
          border: '1px solid #e0e0e0',
          '& .MuiTableCell-root': {
            px: 0.5,
            borderLeft: '1px solid #ccc',
            '&:nth-of-type(1)': {
              width: 40,
              maxWidth: 40,
              textAlign: 'center',
            },
            '&:nth-of-type(2)': {
              whiteSpace: 'nowrap',
              width: 80,
              maxWidth: 80,
              textAlign: 'center',
            },
            '&:nth-of-type(3)': {
              whiteSpace: 'nowrap',
              width: 200,
              textAlign: 'center',
            },
          },
        }}
      >
        <CLStyledTable noMargin>
          <CLDocTableHead yPadding="small">
            <TableRow>
              <TableCell>룰버전</TableCell>
              <TableCell>변경일시</TableCell>
              <TableCell>변경내역</TableCell>
            </TableRow>
          </CLDocTableHead>
          <CLDocTableBody yPadding="small">
            {data
              .sort((a, b) => b.ruleVerno - a.ruleVerno)
              .map((el) => {
                const hstChangeNm =
                  trimAndStringLenght(el.ruleversionchangecode) < 1
                    ? el.ruleversionchangecode
                    : el.ruleversionchangecode
                        .trim()
                        .split(',')
                        .map((el) => hstChangeCode(el))
                        .join(', ');
                return (
                  <TableRow key={el.ruleVerno} onClick={() => openDialog(el)}>
                    <TableCell>{el.ruleVerno}</TableCell>
                    <TableCell>{el.deployDatetime}</TableCell>
                    <TableCell>
                      <Typography sx={{ textAlign: 'left', fontSize: '0.75rem' }}>
                        {hstChangeNm}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
          </CLDocTableBody>
        </CLStyledTable>
        {data.length === 0 && (
          <Stack
            height={100}
            sx={{ backgroundColor: '#fafafe', opacity: 0.5 }}
            justifyContent="center"
            alignItems="center"
          >
            <Typography variant="h5">변경이력이 없습니다.</Typography>
          </Stack>
        )}
      </TableContainer>
      {dialogId === 'RuleInfoHstDialog' && ruleInfoHstDialogProps && (
        <RuleInfoHstDialog {...ruleInfoHstDialogProps} />
      )}
    </Stack>
  );
}
