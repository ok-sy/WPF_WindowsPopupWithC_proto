import CloseIcon from '@mui/icons-material/Close';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { rootSx } from './style';
import CLStyledTable from '@/components/CLStyledTable/CLStyledTable';
import CLDocTableHead from '@/components/CLDocTableHead/CLDocTableHead';
import CLDocTableBody from '@/components/CLDocTableBody/CLDocTableBody';

type Props = {
  onClickClose: () => void;
  onClickRow: (selected: string, parentId: string) => void;
};
const searchFilter: { value: string; title: string }[] = [
  {
    value: 'all',
    title: '전체',
  },
  {
    value: 'apply',
    title: '적용된 룰',
  },
  {
    value: 'disapply',
    title: '미적용 룰',
  },
];

const SAMPLE_SELECT = ['카드', '회원', '가맹점'];
export default function RuleSearchBox(props: Props) {
  const { onClickClose, onClickRow } = props;
  const tableRowRef = useRef<HTMLTableRowElement>(null);
  const rootRef = useRef<HTMLDivElement>();

  const [expand, setExpanded] = useState(false);

  const [radioValue, setRadioValue] = useState('all');

  // 현재 선택된 행 강조 - class 추가
  const updateLastSelection = (id: string) => {
    const root = rootRef.current;
    if (!root) return;

    // 기존 선택 제거
    let elem = root.querySelector(`.RuleSearchBox-selected`);
    if (elem) {
      elem.classList.remove('RuleSearchBox-selected');
    }

    // 신규 선택 강조
    elem = root.querySelector(`.RuleSearchBox-tableRow[data-word-id="${id}"]`);
    if (elem) {
      elem.classList.add('RuleSearchBox-selected');
    }
  };

  return (
    <Box sx={rootSx}>
      <Draggable handle=".RuleSearchBox-top">
        <Paper className="RuleSearchBox-paper">
          <Box className="RuleSearchBox-top">
            <Typography>룰 검색</Typography>
            <IconButton onClick={onClickClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <Box
            sx={{ border: '1px solid #e0e0e0', backgroundColor: '#fff' }}
            mx={1}
            mt={1}
            py={1}
            px={1}
          >
            <Stack direction="row" sx={{ '& .MuiIconButton-root': { width: 36, mr: 0.5 } }}>
              {!expand && (
                <IconButton size="small" onClick={() => setExpanded(!expand)}>
                  <Tooltip title="상세옵션">
                    <KeyboardDoubleArrowDownIcon fontSize="small" />
                  </Tooltip>
                </IconButton>
              )}
              {expand && (
                <IconButton size="small" onClick={() => setExpanded(!expand)}>
                  <Tooltip title="접기">
                    <KeyboardDoubleArrowUpIcon fontSize="small" />
                  </Tooltip>
                </IconButton>
              )}
              <TextField
                size="small"
                placeholder="룰, 그룹명을 검색해주세요."
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton className="RuleMap-button" size="small">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiInputBase-formControl': {
                    pr: 0,
                    borderRadius: 0,
                  },
                }}
              />
            </Stack>
            {expand && (
              <Stack pt={0.5} pl={5}>
                <Stack direction="row">
                  <RadioGroup defaultValue={radioValue}>
                    <Box>
                      {searchFilter.map((el) => (
                        <FormControlLabel
                          key={el.value}
                          value={el.value}
                          control={
                            <Radio
                              onChange={(e) => {
                                setRadioValue(e.target.value);
                              }}
                              size="small"
                            />
                          }
                          label={el.title}
                        />
                      ))}
                    </Box>
                  </RadioGroup>
                </Stack>
              </Stack>
            )}
          </Box>
          <Box ref={rootRef} sx={{ px: 1 }}>
            <TableContainer
              sx={{
                backgroundColor: '#fff',
                overflow: 'auto',
                border: '1px solid #e0e0e0',
                height: 430,
                my: 1,
              }}
            >
              <CLStyledTable noMargin>
                <CLDocTableHead yPadding="small">
                  <TableRow>
                    <TableCell width="15%">#</TableCell>
                    <TableCell>검색 결과</TableCell>
                  </TableRow>
                </CLDocTableHead>
                <CLDocTableBody textAlign="left"></CLDocTableBody>
              </CLStyledTable>
            </TableContainer>
          </Box>
        </Paper>
      </Draggable>
    </Box>
  );
}
