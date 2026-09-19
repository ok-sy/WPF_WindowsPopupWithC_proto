import type { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  '& .RuleMap-topButton': {
    whiteSpace: 'nowrap',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',

    '& .MuiTypography-root': {
      fontSize: '0.75rem',
    },
    '& .MuiSvgIcon-root': {
      width: 19,
      height: 19,
    },
  },

  // 펼쳐진 상태
  '& .RuleMap-topButtons': {
    transition: '0.5s',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    '& .RuleMap-topButton': {
      position: 'relative',
      py: 1,
      flex: 1,
      borderRadius: 0,
      '&:nth-of-type(1)': {
        borderLeft: '1px solid #e0e0e0',
      },

      // 아이콘 마진 제거
      '& .MuiSvgIcon-root': {
        m: 0,
      },

      // 오렌지 컬러? 디자인 의도?
      '&:hover': {
        color: (theme) => theme.palette.primary.main,
        '& .MuiSvgIcon-root': {
          color: (theme) => theme.palette.primary.main,
        },
      },

      // 버튼의 글자 표시
      '& .RuleMap-topButtonTitle': {
        display: 'inline-block',
      },

      // 버튼 구분선 표시
      '&  + .RuleMap-topButton::before': {
        position: 'absolute',
        content: "''",
        left: 0,
        top: 0,
        bottom: 0,
        borderLeft: '1px solid #ddd',
        width: 0,
      },
    },
  },

  // 접혀진 상태
  '&.RuleMap-collapsed .RuleMap-topButtons': {
    mt: '48px',
    flexDirection: 'column',
    alignItems: 'stretch',

    '& .RuleMap-topButton': {
      '&:nth-of-type(1)': {
        borderLeft: 0,
      },
      // 버튼 글자 감추기
      '& .RuleMap-topButtonTitle': {
        display: 'none',
      },

      // 버튼 구분선 감추기
      '&  + .RuleMap-topButton::before': {
        display: 'none',
      },

      // 버튼 사이의 세로 간격 띄우기
      '&  + .RuleMap-topButton': {
        mt: 0.5,
      },
    },
  },
  //룰에서 네비게이션 스타일
  '& .RuleMap-ruleNav': {
    whiteSpace: 'nowrap',
    ml: 1,
    p: 1,
    //네비게이션 버튼 스타일
    '& .MuiButtonBase-root': {
      height: 45,
      border: '0.1px solid #dddddd',
      borderRadius: '50%',
      boxShadow: '3px 3px 7px #ddd',
      minWidth: 30,
      width: 45,
      mr: 2,
      backgroundColor: '#f5f5f5',
      overflow: 'hidden',
      '&:hover': {
        color: (theme) => theme.palette.primary.main,
      },
    },
    //아이콘 크기
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.7rem',
    },
    '& .Mui-selected': {
      backgroundColor: '#fff',
      fontSize: '0.8rem',
      fontWeight: 500,
    },
  },
};
