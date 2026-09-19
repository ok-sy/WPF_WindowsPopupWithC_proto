import type { CustomGridTotal } from '@/components/CustomGrid/grid-type';
import {
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import 'react-resizable/css/styles.css';
import type { SubTotalKey } from '../CloverDataGridHome';
import { DEFAULT_COLUME } from '../grid-sample-data';
interface Props {
  sort: boolean;
  setSort: (sort: boolean) => void;
  textFilter: boolean;
  setTextFilter: (sort: boolean) => void;
  colFilter: boolean;
  setColumeFilter: (sort: boolean) => void;
  sticky: boolean;
  setSticky: (sort: boolean) => void;
  hideHead: boolean;
  setHideHead: (sort: boolean) => void;
  seq: boolean;
  setSeq: (sort: boolean) => void;
  isBasicData: boolean;
  excelExport: boolean;
  setExcelExport: (sort: boolean) => void;
  stripe: boolean;
  setStripe: (sort: boolean) => void;
  page: boolean;
  setPage: (sort: boolean) => void;
  resize: boolean;
  setResize: (sort: boolean) => void;
  multiRow: number;
  setMuiltRow: (sort: number) => void;
  subTotal: SubTotalKey;
  setSubTotal: (sort: SubTotalKey) => void;
  autoSorting: 'asc' | 'desc' | undefined;
  setAutoSorting: (sort: 'asc' | 'desc' | undefined) => void;
  rightClickEvent: boolean;
  setRightClickEvent: (sort: boolean) => void;
  total?: CustomGridTotal[];
  setTotal: (
    isBasic?: {
      sign: 'sum' | 'average' | 'max' | 'min' | 'count';
      age: boolean;
      dollar: boolean;
    },
    nonBasic?: { sign: 'sum' | 'average' | 'max' | 'min' | 'count'; age: boolean; visits: boolean },
  ) => void;
  optionRefresh: number;
}

export default function GridOption(props: Props) {
  const {
    colFilter,
    setSubTotal,
    subTotal,
    excelExport,
    hideHead,
    isBasicData,
    multiRow,
    autoSorting,
    setAutoSorting,
    page,
    resize,
    optionRefresh,
    seq,
    setColumeFilter,
    setExcelExport,
    setHideHead,
    setMuiltRow,
    setPage,
    setResize,
    setSeq,
    setSort,
    setSticky,
    setStripe,
    setTextFilter,
    sort,
    sticky,
    stripe,
    textFilter,
    setTotal,
    rightClickEvent,
    setRightClickEvent,
    total,
  } = props;

  const [ageCheck, setAgeCheck] = useState(false);
  const [dolarCheck, setDolarCheck] = useState(false);
  const [sign, setSign] = useState<'sum' | 'average' | 'max' | 'min' | 'count'>('sum');

  const [visits, setVisits] = useState(false);

  useEffect(() => {
    if (sign === undefined) return;
    if (isBasicData) return;
    setTotal({ sign, age: ageCheck, dollar: dolarCheck });
  }, [ageCheck, dolarCheck, sign]);

  useEffect(() => {
    setAgeCheck(false);
    setDolarCheck(false);
    setSign('sum');
    setVisits(false);
  }, [optionRefresh]);

  useEffect(() => {
    if (sign === undefined) return;
    if (!isBasicData) return;
    setTotal(undefined, { sign, age: ageCheck, visits: visits });
  }, [ageCheck, dolarCheck, sign]);

  const onSubTothandler = (val: string) => {
    const valList =
      val === '1deps'
        ? ['_1deps']
        : val === '2deps'
          ? ['_2deps']
          : val === '3deps'
            ? ['_3deps']
            : val === '12deps'
              ? ['_1deps', '_2deps']
              : val === '13deps'
                ? ['_1deps', '_3deps']
                : val === '23deps'
                  ? ['_2deps', '_3deps']
                  : ['_1deps', '_2deps', '_3deps'];
    setSubTotal({ ...subTotal, col: valList });
  };

  const onSubTothandler2 = (val: string) => {
    const valList =
      val === 'firstName'
        ? ['firstName']
        : val === 'lastName'
          ? ['lastName']
          : ['firstName', 'lastName'];

    setSubTotal({ ...subTotal, col: valList });
  };
  return (
    <Stack direction="column" justifyContent="center" mb={1}>
      <Stack direction="column" spacing={1}>
        <Stack direction="row" justifyContent="center">
          <FormControlLabel
            control={<Checkbox size="small" checked={seq} onChange={(_) => setSeq(!seq)} />}
            label="number"
          />

          <FormControlLabel
            control={
              <Checkbox size="small" checked={stripe} onChange={(_) => setStripe(!stripe)} />
            }
            label="stripe"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={excelExport}
                onChange={(_) => setExcelExport(!excelExport)}
              />
            }
            label="excel export"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={colFilter}
                onChange={(_) => setColumeFilter(!colFilter)}
              />
            }
            label="colume filter"
          />
          <FormControlLabel
            control={
              <Checkbox size="small" checked={resize} onChange={(_) => setResize(!resize)} />
            }
            label="colume resize"
          />
          <FormControlLabel
            control={
              <Checkbox size="small" checked={hideHead} onChange={(_) => setHideHead(!hideHead)} />
            }
            label="hide Head"
          />
          <FormControlLabel
            control={
              <Checkbox size="small" checked={sticky} onChange={(_) => setSticky(!sticky)} />
            }
            label="sticky Head"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={rightClickEvent}
                onChange={(_) => setRightClickEvent(!rightClickEvent)}
              />
            }
            label="right click event"
          />
        </Stack>
        {isBasicData && (
          <Stack direction="row" justifyContent="center">
            <FormControlLabel
              control={<Checkbox size="small" checked={sort} onChange={(_) => setSort(!sort)} />}
              label="sortable"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={textFilter}
                  onChange={(_) => setTextFilter(!textFilter)}
                />
              }
              label="text filter"
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={page} onChange={(_) => setPage(!page)} />}
              label="Pagenation"
            />
          </Stack>
        )}
      </Stack>
      {isBasicData && (
        <Stack pt={1} direction="row" spacing={3} justifyContent="center" alignItems="center">
          <Typography>Multi Row Count : </Typography>
          <Slider
            sx={{ maxWidth: 400 }}
            step={1}
            marks
            min={0}
            max={DEFAULT_COLUME.length}
            value={multiRow}
            onChange={(e, value) => {
              if (typeof value === 'number') {
                setMuiltRow(value);
              }
            }}
          />
          <Typography>{multiRow}</Typography>
        </Stack>
      )}
      {!isBasicData && (
        <Stack spacing={1} sx={{ border: '1px solid #e0e0e0', mt: 1, py: 1.5 }}>
          <Stack pl={2} direction="row" spacing={3} alignItems="center">
            <Typography variant="subtitle2">Total Option</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={ageCheck}
                  onChange={(checked) => setAgeCheck(!ageCheck)}
                />
              }
              label="나이"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={dolarCheck}
                  onChange={(checked) => setDolarCheck(!dolarCheck)}
                />
              }
              label="연봉"
            />

            <FormControl size="small">
              <InputLabel>계산식</InputLabel>
              <Select
                label="계산식"
                size="small"
                sx={{ width: 200 }}
                value={sign}
                onChange={(e) => {
                  const value = e.target.value as 'sum' | 'average' | 'max' | 'min' | 'count';
                  setSign(value);
                }}
              >
                <MenuItem value="sum">합계</MenuItem>
                <MenuItem value="average">평균</MenuItem>
                <MenuItem value="count">개수</MenuItem>
                <MenuItem value="max">최대값</MenuItem>
                <MenuItem value="min">최소값</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Divider />
          <Stack direction="row" pl={2} spacing={3} alignItems="center">
            <Typography variant="subtitle2">SubTotal Option :</Typography>
            <FormControl>
              <FormLabel id="demo-row-radio-buttons-group-label">그룹핑 컬럼</FormLabel>
              <RadioGroup
                onChange={(e) => {
                  onSubTothandler(e.target.value);
                }}
              >
                <Stack direction="row">
                  <FormControlLabel value="1deps" control={<Radio size="small" />} label="본부" />
                  <FormControlLabel value="2deps" control={<Radio size="small" />} label="팀" />
                  <FormControlLabel value="3deps" control={<Radio size="small" />} label="직급" />
                </Stack>
                <Stack direction="row">
                  <FormControlLabel
                    value="12deps"
                    control={<Radio size="small" />}
                    label="본부, 팀"
                  />
                  <FormControlLabel
                    value="13deps"
                    control={<Radio size="small" />}
                    label="본부, 직급"
                  />
                  <FormControlLabel
                    value="23deps"
                    control={<Radio size="small" />}
                    label="팀, 직급"
                  />
                  <FormControlLabel
                    value="123deps"
                    control={<Radio size="small" />}
                    label="본부, 팀, 직급"
                  />
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl size="small">
              <InputLabel>계산될 컬럼</InputLabel>
              <Select
                label="계산될 컬럼"
                size="small"
                sx={{ width: 200 }}
                value={subTotal?.calCol ?? ''}
                onChange={(e) => {
                  setSubTotal({ ...subTotal, calCol: e.target.value });
                }}
              >
                <MenuItem value="age">나이</MenuItem>
                <MenuItem value="dollar">연봉</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>계산식</InputLabel>
              <Select
                label="계산식"
                size="small"
                sx={{ width: 200 }}
                value={subTotal.sign}
                onChange={(e) => {
                  const value = e.target.value as 'sum' | 'average' | 'max' | 'min' | 'count';
                  setSubTotal({ ...subTotal, sign: value });
                }}
              >
                <MenuItem value="sum">합계</MenuItem>
                <MenuItem value="average">평균</MenuItem>
                <MenuItem value="count">개수</MenuItem>
                <MenuItem value="max">최대값</MenuItem>
                <MenuItem value="min">최소값</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      )}
      {isBasicData && (
        <Stack spacing={1} sx={{ border: '1px solid #e0e0e0', mt: 1, py: 1.5 }}>
          <Stack pl={2} direction="row" spacing={3} alignItems="center">
            <Typography variant="subtitle2">Total Option</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={ageCheck}
                  onChange={(checked) => setAgeCheck(!ageCheck)}
                />
              }
              label="age"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={visits}
                  onChange={(checked) => setVisits(!visits)}
                />
              }
              label="visits"
            />

            <FormControl size="small">
              <InputLabel>계산식</InputLabel>
              <Select
                label="계산식"
                size="small"
                sx={{ width: 200 }}
                value={sign}
                onChange={(e) => {
                  const value = e.target.value as 'sum' | 'average' | 'max' | 'min' | 'count';
                  setSign(value);
                }}
              >
                <MenuItem value="sum">합계</MenuItem>
                <MenuItem value="average">평균</MenuItem>
                <MenuItem value="count">개수</MenuItem>
                <MenuItem value="max">최대값</MenuItem>
                <MenuItem value="min">최소값</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Divider />
          <Stack direction="row" spacing={3} alignItems="center">
            <Typography pl={2} variant="subtitle2">
              SubTotal Option :
            </Typography>
            <FormControl>
              <FormLabel>그룹핑 컬럼</FormLabel>
              <RadioGroup
                row
                key={optionRefresh}
                sx={{ width: 200 }}
                onChange={(e) => {
                  onSubTothandler2(e.target.value);
                }}
              >
                <FormControlLabel
                  value="firstName"
                  control={<Radio size="small" />}
                  label="firstName"
                />
                <FormControlLabel
                  value="lastName"
                  control={<Radio size="small" />}
                  label="lastName"
                />
                <FormControlLabel
                  value="double"
                  control={<Radio size="small" />}
                  label="firstName, lastName"
                />
              </RadioGroup>
            </FormControl>
            <FormControl size="small">
              <InputLabel>계산될 컬럼</InputLabel>
              <Select
                label="계산될 컬럼"
                size="small"
                sx={{ width: 200 }}
                value={subTotal?.calCol ?? ''}
                onChange={(e) => {
                  setSubTotal({ ...subTotal, calCol: e.target.value });
                }}
              >
                <MenuItem value="age">age</MenuItem>
                <MenuItem value="visits">visits</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>계산식</InputLabel>
              <Select
                label="계산식"
                size="small"
                sx={{ width: 150 }}
                value={subTotal.sign}
                onChange={(e) => {
                  const value = e.target.value as 'sum' | 'average' | 'max' | 'min' | 'count';
                  setSubTotal({ ...subTotal, sign: value });
                }}
              >
                <MenuItem value="sum">합계</MenuItem>
                <MenuItem value="average">평균</MenuItem>
                <MenuItem value="count">개수</MenuItem>
                <MenuItem value="max">최대값</MenuItem>
                <MenuItem value="min">최소값</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ pl: 2 }}>
              <FormLabel id="demo-row-radio-buttons-group-label">자동정렬</FormLabel>
              <RadioGroup
                row
                key={optionRefresh}
                value={autoSorting}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'undefined') {
                    setAutoSorting(undefined);
                  } else if (value === 'asc') {
                    setAutoSorting('asc');
                  } else {
                    setAutoSorting('desc');
                  }
                }}
              >
                <FormControlLabel
                  value="undefined"
                  control={<Radio size="small" />}
                  label="선택안함"
                />
                <FormControlLabel value="asc" control={<Radio size="small" />} label="asc" />
                <FormControlLabel value="desc" control={<Radio size="small" />} label="desc" />
              </RadioGroup>
            </FormControl>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
