// import { LightboxImageOpenedEvent } from '@/custom-events'
import { Dialog, DialogProps, Paper, PaperProps, useMediaQuery, useTheme } from '@mui/material';
import clsx from 'clsx';
import * as React from 'react';
import Draggable from 'react-draggable';
import { flatSx } from '../../lib/sx-props';
import { rootSx } from './style';

const dragableDialog = (props: PaperProps) => {
  return (
    <Draggable handle=".CustomDialogTitle-root" cancel=".MuiDialogContent-root">
      <Paper sx={{ '& .CustomDialogTitle-root': { cursor: 'move' } }} {...props} />
    </Draggable>
  );
};
/**
 * BackLightOn : 다이얼로그 뒷 배경 어두워지는 속성이 제거됨
 */
type Props = {
  backLightOn?: boolean;
} & DialogProps;

/**
 * 드래그 가능한 Dialog title 부분
 * 클래스 명으로 드래그 가능한 영역을 정의했기 때문에,
 * CustomDialog안에 CustomDialogTitle만 드래그적용된다(그냥 DialogTitle안됌)
 */
export const CustomDragableDialog = React.forwardRef<HTMLDivElement, Props>(
  (props: Props, ref): JSX.Element => {
    const { sx, className, backLightOn = false, disableEscapeKeyDown, ...otherProps } = props;

    const disableEscapeKey = disableEscapeKeyDown;
    const theme = useTheme();
    const xsOrDown = useMediaQuery(theme.breakpoints.down('sm'));

    return (
      <Dialog
        ref={ref}
        disableEscapeKeyDown={disableEscapeKey ?? false}
        className={clsx('CustomDragableDialog-root', className)}
        sx={flatSx(rootSx, sx, {
          '& .MuiBackdrop-root': {
            backgroundColor: backLightOn ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
            display: backLightOn ? 'none' : 'block',
          },
        })}
        PaperComponent={xsOrDown ? Paper : dragableDialog}
        {...otherProps}
      />
    );
  },
);

CustomDragableDialog.displayName = 'CustomDragableDialog';
