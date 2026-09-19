import type { SxProps } from '@mui/material';

export const rootSx: SxProps = {
  py: 1,
  pl: 1,
  pr: 3, // 우측 스크롤바때문에 여백을 더 주는 것이 예뻐
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  position: 'relative',
  flex: 1,
  '& .MuiButton-root': { fontWeight: 400, fontSize: '0.8125rem' },

  '& .RuleHome-mapBox': {
    transition: '0.5s',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
  },

  '& .RuleHome-portlet': {
    transition: '0.5s',
    position: 'relative',
    display: 'block',
    minWidth: 300,
    flexBasis: 300,
  },

  '& .RuleHome-collapseBtn': {
    position: 'absolute',
    right: 'unset',
    top: 3,
    left: 3,
  },

  '&.RuleHome-sideCollapsed': {
    '& .RuleHome-portlet': {
      minWidth: 50,
      flexBasis: 55,
    },
  },
  '& .RuleHome-portlet-rule': {
    flex: 1,
    ml: 1,
    overflow: 'auto',
  },

  '& .RuleHome-portlet-ruleContent': {
    display: 'flex',
    flexDirection: 'column',
  },
};
