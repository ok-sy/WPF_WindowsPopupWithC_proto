import { SxProps, Theme } from '@mui/material';

export const rootSx: SxProps<Theme> = {
  // empty current
  '& .MuiInputBase-root': {
    fontSize: '0.75rem',
  },

  // 이렇게 하면 안됨
  //   '& .MuiTypography-root': {
  //     fontSize: '0.75rem',
  //   },

  '& .MuiButtonBase-root': {
    fontSize: '0.75rem',
  },
  '& .CLDocLabelAny-children': {
    '& .MuiFormControlLabel-label': {
      fontSize: '0.75rem',
    },
  },
  '& .CLDocLabelInput-titleBox': {
    width: 150,
  },
  '& .CLDocLabelSelect-titleBox': {
    width: 150,
  },
  '& .CLDocLabelAny-titleBox': {
    width: 150,
  },
};
