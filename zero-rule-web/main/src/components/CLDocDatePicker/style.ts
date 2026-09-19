import type { PopperProps, SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  '& .MuiInputBase-root': {
    fontSize: '0.7rem',
    borderRadius: 0,
    '& .MuiInputBase-input': {
      p: 0.8,
    },
  },

  '& .MuiButtonBase-root': {
    width: 30,
    height: 30,
  },
};
//달력 팝업 스타일
export const popperProps: Partial<PopperProps> = {
  placement: 'bottom-start',
  sx: {
    '& .MuiCalendarOrClockPicker-root': {
      '& > div': {
        width: 204,
        height: 250,
      },
    },
    '& .MuiCalendarPicker-root': {
      width: 204,
      height: 250,
    },
    '& .MuiPickersCalendarHeader-root': {
      backgroundColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.09),
      my: 0,
      py: 3,
      '& .MuiButtonBase-root': {
        width: 30,
        height: 30,
      },
    },
    '& .PrivatePickersYear-yearButton': {
      fontSize: '0.8rem',
      width: 50,
      height: 27,
    },
    '& .MuiPickersFadeTransitionGroup-root': {
      fontSize: '0.6rem',
      overflow: 'hidden',
      '& .MuiPickersCalendarHeader-label': {
        fontSize: '0.8rem',
        whiteSpace: 'nowrap',
      },
      '& .MuiPickersDay-root': {
        height: 25,
        width: 25,
      },
    },
    '& .MuiDayPicker-header': {
      width: 200,
      '& .MuiTypography-root': {
        fontSize: '0.9rem',
        '&:nth-of-type(1)': {
          color: 'red',
        },
        '&:nth-of-type(7)': {
          color: 'blue',
        },
      },
    },
    '& .PrivatePickersSlideTransition-root': {
      width: 200,
    },
  },
};
