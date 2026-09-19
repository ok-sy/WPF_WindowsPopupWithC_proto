import CLStyledTreeItem from '@/components/CLStyledTreeItem/CLStyledTreeItem';
import CLStyledTreeView from '@/components/CLStyledTreeView/CLStyledTreeView';
import TextOverField from '@/components/TextOverField';
import errorCustomHandle from '@/lib/error-custom-handle';
import { useApi } from '@/provider';
import type { ApiRequestContext, Rule, RuleInterface, TreeIfRules } from '@local/domain';
import { flatSx, isEnterKeyEvent, useElementLeftTop } from '@local/ui';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import * as React from 'react';
import { rootSx } from './style';
type Props = {
  sx?: SxProps;
  refresh: number;
  onSubmitRefresh: (data: number) => void;
  onSubmitCreatePage: () => void;
  onSubmitSelectedRuleId: (val: Rule, ifVal: RuleInterface) => void;
  onSubmitSelectedIfId: (ifVal: RuleInterface) => void;
  treeIfRules: TreeIfRules[];
  setTreeIfRules: (val: TreeIfRules[]) => void;
  deployBtnDisable: boolean;
  treeSelecteding?: string;
};
type SearchParams = {
  keyword?: string;
};
export default function RuleMap(props: Props) {
  const {
    sx,
    onSubmitCreatePage,
    refresh,
    onSubmitRefresh,
    onSubmitSelectedRuleId,
    onSubmitSelectedIfId,
    setTreeIfRules,
    treeIfRules,
    deployBtnDisable,
    treeSelecteding,
  } = props;
  const setTreeIfRulesFnRef = React.useRef<Props['setTreeIfRules']>();
  setTreeIfRulesFnRef.current = setTreeIfRules;
  const [treeExpanded, setTreeExpanded] = React.useState<string[]>(['disapprove']);
  const [treeSelected, setTreeSelected] = React.useState<string[]>(['']);
  const [bodyElement, setBodyElement] = React.useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const [loading, setLoading] = React.useState(false);
  const [keywords, setKeywords] = React.useState<string>('');
  const keywordsFnRef = React.useRef<string>('');
  keywordsFnRef.current = keywords;
  const [searchRefresh, setSearchRefresh] = React.useState(0);

  const api = useApi();

  const doReload = React.useCallback(
    async (params: { keyword: string }, ctx: ApiRequestContext) => {
      try {
        setLoading(true);
        const { body } = await api.rule.treeList({ ctx, ...params });
        setTreeIfRulesFnRef.current?.(body.treeIfRules);
        setTreeExpanded(['1', ...body.treeIfRules.map((el) => el.ifid)]);
        if (ctx.canceled) return;
      } catch (err) {
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api, setTreeIfRulesFnRef],
  );

  React.useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload({ keyword: keywordsFnRef.current }, ctx);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReload, refresh, searchRefresh, keywordsFnRef]);

  React.useEffect(() => {
    if (!treeSelecteding) return;
    setTreeSelected([treeSelecteding]);
  }, [treeSelecteding]);

  const handleClickSearch = () => {
    setSearchRefresh(Date.now());
    if (keywords.length === 0) {
      return setSearchRefresh(Date.now());
    }
  };

  // 트리 전체 닫기
  const TreeHandleCollapseClick = () => {
    if (!treeIfRules) return;
    setTreeExpanded((oldExpanded) =>
      oldExpanded.length !== treeIfRules.length + 1
        ? ['1', ...treeIfRules.map((el) => el.ifid)]
        : // : [],
          ['1'],
    );
  };

  // 트리 확장 핸들러
  const handleItemExpansionToggle = (
    _event: React.SyntheticEvent,
    itemId: string,
    isExpanded: boolean,
  ) => {
    if (isExpanded) {
      setTreeExpanded((prev) => {
        if (prev.includes(itemId)) {
          return prev;
        }
        return prev.concat(itemId);
      });
    } else {
      setTreeExpanded((prev) => {
        if (prev.includes(itemId)) {
          return prev.filter((it) => it !== itemId);
        }
        return prev;
      });
    }
  };

  // 트리 선택 핸들러
  const handleItemSelectionToggle = (
    _event: React.SyntheticEvent,
    itemId: string,
    isSelected: boolean,
  ) => {
    if (isSelected) {
      setTreeSelected((prev) => {
        if (prev.includes(itemId)) {
          return prev;
        }
        return prev.concat(itemId);
      });
    } else {
      setTreeSelected((prev) => {
        if (prev.includes(itemId)) {
          return prev.filter((it) => it !== itemId);
        }
        return prev;
      });
    }
  };

  return (
    <Box className="RuleMap-root" sx={flatSx(rootSx, sx)} key={refresh}>
      <Box
        sx={{
          p: 1,
          position: 'relative',
        }}
      >
        {loading && (
          <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
        <Stack>
          <Stack maxHeight={35} direction="row" justifyContent="space-between" pb={0.5}>
            <Stack direction="row" spacing={0.5}>
              <Button
                size="small"
                variant="outlined"
                disabled={deployBtnDisable}
                onClick={() => onSubmitCreatePage()}
              >
                룰추가
              </Button>
            </Stack>
            <IconButton
              size="small"
              color="primary"
              disabled={loading}
              onClick={() => {
                onSubmitRefresh(Date.now());
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Stack>
          <Stack spacing={1} direction="row" alignItems="center" justifyContent="space-between">
            <Stack flex={1} direction="row" spacing={1}>
              <TextField
                fullWidth
                InputLabelProps={{
                  style: { fontSize: '0.7rem', marginTop: '-5px' }, // 라벨 텍스트 크기 조정
                }}
                sx={{
                  alignSelf: 'center',
                  '& .MuiInputBase-root': {
                    fontSize: '0.7rem',
                    maxHeight: 25,
                  },
                }}
                size="small"
                placeholder="검색"
                type="search"
                value={keywords}
                onChange={(e) => {
                  const value = e.target.value;
                  setKeywords(value);
                  if (value.length === 0) {
                    setSearchRefresh(Date.now());
                  }
                }}
                onKeyDown={(e) => {
                  if (isEnterKeyEvent(e)) {
                    setSearchRefresh(Date.now());
                  }
                }}
              />
              <Button size="small" variant="outlined" onClick={() => handleClickSearch()}>
                검색
              </Button>
            </Stack>
            {treeExpanded.length !== treeIfRules.length + 1 ? (
              <Tooltip arrow title="전체 열기">
                <IconButton
                  sx={{ mr: 1, '& .MuiSvgIcon-root': { width: '1.2rem' } }}
                  size="small"
                  onClick={TreeHandleCollapseClick}
                >
                  <AddBoxOutlinedIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip arrow title="전체 닫기">
                <IconButton
                  sx={{ mr: 1, '& .MuiSvgIcon-root': { width: '1.2rem' } }}
                  size="small"
                  onClick={TreeHandleCollapseClick}
                >
                  <IndeterminateCheckBoxOutlinedIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
        <Box
          ref={setBodyElement}
          sx={{
            maxHeight: `calc(100vh - ${bodyTop}px - 48px)`,
            minHeight: `calc(100vh - ${bodyTop}px - 48px)`,
            overflow: 'auto',
          }}
        >
          <CLStyledTreeView
            sx={{
              '& .MuiTreeItem-label': { fontSize: '0.83rem' },
            }}
            expandedItems={treeExpanded}
            selectedItems={treeSelected}
            onItemExpansionToggle={handleItemExpansionToggle}
            onItemSelectionToggle={handleItemSelectionToggle}
          >
            <CLStyledTreeItem key={'1'} itemId={'1'} label={'룰'}>
              {treeIfRules === undefined ? (
                <Typography>등록된 데이터가없습니다</Typography>
              ) : (
                treeIfRules.map((interf) => {
                  return (
                    <CLStyledTreeItem
                      sx={{ borderLeft: '0.5px solid #e0e0e0' }}
                      key={interf.ifid}
                      itemId={interf.ifid}
                      label={
                        <TextOverField
                          text={interf.ifid + '.' + interf.ifNm}
                          maxWidth={220}
                          fontSize="0.85rem"
                        />
                      }
                      onClick={() => onSubmitSelectedIfId(interf)}
                      labelIcon={
                        interf.rules !== null && (
                          <Image
                            width={15}
                            height={11}
                            src="/images/rullIcon/folder-close.png"
                            alt=""
                          />
                        )
                      }
                    >
                      {interf.rules === undefined ? (
                        <></>
                      ) : (
                        interf.rules?.map((rule) => {
                          let ruleColor = '';
                          if (rule.ruleApplyYn === 'Y') {
                            ruleColor = '#002984';
                          } else if (rule.ruleApplyYn === 'N') {
                            ruleColor = '#aaa';
                          }
                          const iconType =
                            rule.treeIconType === null ? undefined : rule.treeIconType;
                          return (
                            <CLStyledTreeItem
                              sx={{
                                borderLeft: '0.5px solid #e0e0e0',
                                '& .MuiTreeItem-iconContainer': { width: 0 },
                                color: ruleColor,
                              }}
                              key={rule.ruleid}
                              itemId={rule.ruleid}
                              label={
                                <Stack direction="row">
                                  <Typography
                                    color={'chocolate'}
                                    pr={0.3}
                                    pl={iconType === undefined ? 1 : 0}
                                  >
                                    {iconType}
                                  </Typography>
                                  <TextOverField
                                    text={rule.ruleid + '.' + rule.ruleNm}
                                    maxWidth={220}
                                    fontSize="0.85rem"
                                  />
                                </Stack>
                              }
                              onClick={() => {
                                onSubmitSelectedRuleId(rule, {
                                  ifid: interf.ifid,
                                  ifNm: interf.ifNm,
                                  iftypeCd: interf.iftypeCd,
                                  sourceHostNm: interf.sourceHostNm,
                                  targetTableNm: interf.targetTableNm,
                                });
                              }}
                            ></CLStyledTreeItem>
                          );
                        })
                      )}
                    </CLStyledTreeItem>
                  );
                })
              )}
            </CLStyledTreeItem>
          </CLStyledTreeView>
        </Box>
      </Box>
    </Box>
  );
}
