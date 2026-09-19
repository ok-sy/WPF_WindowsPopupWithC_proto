import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { CustomDialogTitle, CustomDragableDialog } from '@local/ui';
import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  ButtonGroup,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import type { RuleInfoConditionExprSum } from '@/features/RuleHome/components/RuleConditionList';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { trimAndStringLenght } from '@/lib/common-validation';
import { Zoom } from 'react-awesome-reveal';

const rootSx: SxProps = {};
export type ReadStateConditionListDialogProps = {
  open: boolean;
  onClose: () => void;
  selIdx: number;
  data: RuleInfoConditionExprSum[];
};

export default function ReadStateConditionListDialog(props: ReadStateConditionListDialogProps) {
  const { open, onClose, selIdx, data } = props;
  const [selIdxData, setSelIdxData] = useState(0);
  const [dataList, setDataList] = useState<RuleInfoConditionExprSum>();
  useEffect(() => {
    setDataList(data[selIdx]);
    setSelIdxData(selIdx);
  }, [selIdx, data]);
  // 이전순서 버튼 클릭
  const backNoBtn = () => {
    if (selIdxData <= 0) {
      return;
    }
    const newSelIdx = selIdxData - 1;
    setSelIdxData(newSelIdx);
    setDataList(data[newSelIdx]);
  };
  // 다음순서 버튼 클릭
  const nextNoBtn = () => {
    if (selIdxData >= data.length - 1) {
      return;
    }
    const newSelIdx = selIdxData + 1;
    setSelIdxData(newSelIdx);
    setDataList(data[newSelIdx]);
  };
  return (
    <CustomDragableDialog
      maxWidth="xs"
      fullWidth
      backLightOn
      className="ReadStateConditionListDialog-root"
      sx={rootSx}
      open={open}
      onClose={onClose}
    >
      <CustomDialogTitle title="조건식 리스트" onClose={onClose}>
        <Stack direction="row" alignItems="center" ml={2} spacing={1}>
          <Stack direction="row" spacing={0.5}>
            <Typography>순서:</Typography>
            <Zoom
              style={{ color: 'Highlight' }}
              duration={700}
              className="MetaGlossarySearch-resultCount"
              key={dataList?.ruleconditionno}
            >
              <Typography>{dataList?.ruleconditionno}</Typography>
            </Zoom>
          </Stack>
          <ButtonGroup
            sx={{
              p: 0, // ButtonGroup의 padding 제거
              fontSize: '0.5rem', // fontSize를 더 줄입니다
              minWidth: 'auto',
              minHeight: 'auto',
              lineHeight: 1,
            }}
          >
            <Button
              onClick={backNoBtn}
              disabled={selIdxData <= 0}
              variant="outlined"
              sx={{
                p: '1px 0px', // padding을 더 줄입니다
                fontSize: '0.5rem !important', // fontSize를 더 줄입니다
                minWidth: 'auto',
                minHeight: 'auto',
                lineHeight: 1,
                borderWidth: '1px', // border 두께를 줄입니다
              }}
            >
              <KeyboardArrowLeftIcon sx={{ width: 16, height: 16 }} /> {/* Icon 크기 줄이기 */}
            </Button>
            <Button
              onClick={nextNoBtn}
              disabled={selIdxData >= data.length - 1}
              variant="outlined"
              sx={{
                p: '1px 1px', // padding을 더 줄입니다
                fontSize: '0.5rem !important', // fontSize를 더 줄입니다
                minWidth: 'auto',
                minHeight: 'auto',
                lineHeight: 1,
                borderWidth: '1px', // border 두께를 줄입니다
              }}
            >
              <KeyboardArrowRightIcon sx={{ width: 16, height: 16 }} /> {/* Icon 크기 줄이기 */}
            </Button>
          </ButtonGroup>
        </Stack>
      </CustomDialogTitle>

      <DialogContent
        sx={{ backgroundColor: '#fafafe' }}
        dividers
        className="ReadStateConditionListDialog-content"
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <Stack
              spacing={1}
              flex={1}
              sx={{ backgroundColor: '#fff', border: '0.5px solid #ccc', p: 1, borderRadius: 3 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                수정구분
              </Typography>
              <Box>{dataList?.uptGubun ?? 'R'}</Box>
            </Stack>
            <Stack
              spacing={1}
              flex={1}
              sx={{ backgroundColor: '#fff', border: '0.5px solid #ccc', p: 1, borderRadius: 3 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                순서
              </Typography>
              <Box>{dataList?.ruleconditionno}</Box>
            </Stack>
          </Stack>
          <Stack
            spacing={1}
            flex={1}
            sx={{ backgroundColor: '#fff', border: '0.5px solid #ccc', p: 1, borderRadius: 3 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              반환값
            </Typography>
            <Box>
              {dataList?.returnitemExprDesc.map((el, descIdx) => {
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
            </Box>
          </Stack>
          <Stack
            spacing={1}
            flex={1}
            sx={{ backgroundColor: '#fff', border: '0.5px solid #ccc', p: 1, borderRadius: 3 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              조건식
            </Typography>
            <Box>{dataList?.conditionInfixDesc}</Box>
          </Stack>
          <Stack
            spacing={1}
            flex={1}
            sx={{ backgroundColor: '#fff', border: '0.5px solid #ccc', p: 1, borderRadius: 3 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              설명
            </Typography>
            <Box>{dataList?.conditionDesc ?? '없음'}</Box>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          닫기
        </Button>
      </DialogActions>
    </CustomDragableDialog>
  );
}
