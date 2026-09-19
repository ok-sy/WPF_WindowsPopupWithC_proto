import { trimAndStringLenght } from '@/lib/common-validation';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import FilterListIcon from '@mui/icons-material/FilterList';
import HeightRoundedIcon from '@mui/icons-material/HeightRounded';
import { Box, IconButton, Popover, Stack, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'react-use';
import { sortBtnHandle } from '../grid-fn';
import type {
  CustomGridColumnFilter,
  CustomGridFilterNumType,
  CustomGridFilterType,
  CustomGridSortingType,
} from '../grid-type';
import TextFilterPopover from './TextFilterPopover';
type Props = {
  data: CustomGridColumnFilter;
  sortMode: boolean;
  sorting?: CustomGridSortingType;
  textFilterMode: boolean;
  setFiltering: (data: CustomGridFilterType) => void;
  setNumFiltering: (data: CustomGridFilterNumType, minMax: string) => void;
  setSorting: (data: CustomGridSortingType) => void;
  onNumOperator: (oper: CustomGridFilterNumType, minMax: string) => void;
  filtering?: CustomGridFilterType;
  numFiltering?: CustomGridFilterNumType;
  setSortingData?: CustomGridSortingType;
};
export default function ColumnCommonStack(props: Props) {
  const {
    data,
    setSorting,
    sortMode,
    textFilterMode,
    setFiltering,
    sorting,
    setNumFiltering,
    onNumOperator,
    filtering,
    numFiltering,
    setSortingData,
  } = props;

  const setFilteringFnRef = useRef<Props['setFiltering']>();
  setFilteringFnRef.current = setFiltering;

  const [debouncedKeyword, setDebouncedKeyword] = useState<string>();
  const [stringValue, setStringValue] = useState<string>();
  const [operator, setOperator] = useState<CustomGridFilterType['operator']>('contain');
  const [numOpFilter, setNumOpFilter] = useState<CustomGridFilterNumType>();
  const [popOverHandle, setPopOverHandle] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (data.columeType === 'number') {
      if (numFiltering !== undefined) {
        setNumOpFilter({ ...numFiltering });
        if (numFiltering.minValue !== undefined) {
          setNumFiltering(numFiltering, 'min');
        } else if (numFiltering.maxValue !== undefined) {
          setNumFiltering(numFiltering, 'max');
        } else {
          setNumFiltering(numFiltering, 'oper');
        }
      } else {
        setNumOpFilter({ columeId: data.columeId, numOperator: 'between' });
      }
    }
  }, [data, numFiltering]);

  const handleClickPop = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopOverHandle(event.currentTarget);
  };
  const handleClosePop = () => {
    setPopOverHandle(null);
  };

  useDebounce(() => setDebouncedKeyword(stringValue), 300, [stringValue]);

  useEffect(() => {
    const filterData: CustomGridFilterType = {
      columeId: data.columeId,
      keyword: debouncedKeyword,
      operator,
    };
    setFilteringFnRef.current?.(filterData);
  }, [data, debouncedKeyword, operator]);

  useEffect(() => {
    if (filtering === undefined) return;
    const defaultFilter = { ...filtering };
    if (defaultFilter === undefined) return;
    setStringValue(defaultFilter.keyword);
  }, [filtering]);

  useEffect(() => {
    const filterData: CustomGridFilterType = {
      columeId: data.columeId,
      keyword: debouncedKeyword,
      operator,
    };
    setFilteringFnRef.current?.(filterData);
  }, [data, debouncedKeyword, operator]);

  const textPlaceHolder =
    operator === 'contain' ? '포함' : operator === 'equals' ? '동일' : '일치하지 않음';

  const numPlaceHolder =
    numOpFilter === undefined
      ? 'between'
      : numOpFilter.numOperator === 'between'
        ? 'between'
        : numOpFilter.numOperator === '='
          ? '같다'
          : numOpFilter.numOperator === '!='
            ? '같지않다'
            : numOpFilter.numOperator === '<'
              ? '작다'
              : numOpFilter.numOperator === '<='
                ? '작거나 같다'
                : numOpFilter.numOperator === '>'
                  ? '크다'
                  : '크거나 같다';

  return (
    <>
      <Stack
        sx={{
          width: '100%',
          pl: sortMode ? 1.5 : 0,
          pr: 0.5,
          py: 1,
        }}
        direction="row"
        alignItems="center"
        justifyContent={sortMode ? 'space-between' : 'center'}
      >
        <Box></Box>
        {data.columeName}
        {data.columeType === 'component' && <Box sx={{ p: 0.5 }}></Box>}
        {sortMode && (
          <Box>
            {sortMode && sorting === undefined && data.columeType !== 'component' ? (
              <IconButton
                size="small"
                onClick={() => {
                  setSorting(
                    sortBtnHandle(data.columeId, data.columeType, sorting) as CustomGridSortingType,
                  );
                }}
              >
                <HeightRoundedIcon fontSize="small" />
              </IconButton>
            ) : sorting !== undefined && sorting.columeId === data.columeId ? (
              <IconButton
                size="small"
                onClick={() => {
                  setSorting(
                    sortBtnHandle(data.columeId, data.columeType, sorting) as CustomGridSortingType,
                  );
                }}
              >
                {sorting.order === 'asc' ? (
                  <ArrowUpwardRoundedIcon fontSize="small" />
                ) : (
                  <ArrowDownwardRoundedIcon fontSize="small" />
                )}
              </IconButton>
            ) : (
              <Box sx={{ width: 30 }}></Box>
            )}
          </Box>
        )}
      </Stack>
      {textFilterMode && (
        <Box
          sx={
            {
              // maxWidth: data.maxWidth,
            }
          }
        >
          {data.columeType === 'string' && (
            <Stack
              spacing={0.5}
              direction="row"
              alignItems="center"
              sx={{
                px: 0.5,
                pb: 0.5,
              }}
            >
              <TextField
                fullWidth
                sx={{ backgroundColor: '#fff' }}
                onChange={(e) => {
                  const keyword = e.target.value ?? '';
                  setStringValue(keyword);
                }}
                value={stringValue}
                placeholder={textPlaceHolder}
                type="search"
                size="small"
              />

              <IconButton
                size="small"
                sx={{ width: 25, height: 25 }}
                onClick={(e) => handleClickPop(e)}
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
              <Popover
                open={Boolean(popOverHandle)}
                anchorEl={popOverHandle}
                onClose={handleClosePop}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <TextFilterPopover
                  isStr
                  onSubmit={(oper: CustomGridFilterType['operator']) => {
                    setOperator(oper);
                    handleClosePop();
                  }}
                />
              </Popover>
            </Stack>
          )}
          {data.columeType === 'number' && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ px: 0.5, pb: 0.5, minWidth: 180 }}
            >
              {numPlaceHolder === 'between' ? (
                <>
                  {' '}
                  <TextField
                    fullWidth
                    sx={{ backgroundColor: '#fff' }}
                    value={numOpFilter?.minValue}
                    onChange={(e) => {
                      let value: undefined | number = Number(e.target.value);
                      if (trimAndStringLenght(e.target.value) < 1) {
                        value = undefined;
                      }
                      //@ts-ignore
                      setNumOpFilter({ ...numOpFilter, minValue: value });
                      setNumFiltering(
                        {
                          columeId: data.columeId,
                          minValue: value,
                          maxValue: undefined,
                          operValue: undefined,
                          numOperator: 'between',
                        },
                        'min',
                      );
                    }}
                    placeholder="min"
                    type="number"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    value={numOpFilter?.maxValue}
                    onChange={(e) => {
                      let value: undefined | number = Number(e.target.value);
                      if (trimAndStringLenght(e.target.value) < 1) {
                        value = undefined;
                      }
                      //@ts-ignore
                      setNumOpFilter({ ...numOpFilter, maxValue: value });
                      setNumFiltering(
                        {
                          columeId: data.columeId,
                          minValue: undefined,
                          maxValue: value,
                          operValue: undefined,
                          numOperator: 'between',
                        },
                        'max',
                      );
                    }}
                    sx={{ backgroundColor: '#fff' }}
                    placeholder="max"
                    type="number"
                    size="small"
                  />
                </>
              ) : (
                <TextField
                  fullWidth
                  sx={{ backgroundColor: '#fff' }}
                  value={numOpFilter?.operValue}
                  onChange={(e) => {
                    let value: undefined | number = Number(e.target.value);
                    if (trimAndStringLenght(e.target.value) < 1) {
                      value = undefined;
                    }
                    //@ts-ignore
                    setNumOpFilter({ ...numOpFilter, operValue: value });
                    setNumFiltering(
                      {
                        columeId: data.columeId,
                        minValue: undefined,
                        maxValue: undefined,
                        operValue: value,
                        numOperator: numOpFilter?.numOperator ?? 'between',
                      },
                      'oper',
                    );
                  }}
                  placeholder={numPlaceHolder}
                  type="number"
                  size="small"
                />
              )}

              <IconButton
                size="small"
                sx={{ width: 25, height: 25 }}
                onClick={(e) => handleClickPop(e)}
              >
                {numOpFilter?.numOperator === undefined ? (
                  <FilterListIcon fontSize="small" />
                ) : numOpFilter.numOperator === 'between' ? (
                  'B'
                ) : (
                  numOpFilter.numOperator
                )}
              </IconButton>
              <Popover
                open={Boolean(popOverHandle)}
                anchorEl={popOverHandle}
                onClose={handleClosePop}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <TextFilterPopover
                  onSubmitNum={(oper: CustomGridFilterNumType['numOperator']) => {
                    if (!numOpFilter) return;
                    setNumOpFilter({ ...numOpFilter, numOperator: oper });
                    onNumOperator(
                      {
                        columeId: data.columeId,
                        numOperator: oper,
                        maxValue: undefined,
                        minValue: undefined,
                      },
                      'oper',
                    );
                    handleClosePop();
                  }}
                />
              </Popover>
            </Stack>
          )}
        </Box>
      )}
    </>
  );
}
