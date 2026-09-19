// import { LightboxImageOpenedEvent } from '@/custom-events'
import { Dialog, DialogProps } from '@mui/material';
import clsx from 'clsx';
import * as React from 'react';
import { flatSx } from '../../lib/sx-props';
import { rootSx } from './style';

type Props = DialogProps;

/**
 * CustomDialog의 용도
 * 글자 크기나 색상 등의 스타일이 설정된 시스템에서 공통으로 사용할 다이얼로그다.
 */
export const CustomDialog = React.forwardRef<HTMLDivElement, Props>(
  (props: Props, ref): JSX.Element => {
    const { sx, className, disableEscapeKeyDown, ...otherProps } = props;
    // const lightboxImageOpened$ = useObservable(LightboxImageOpenedEvent.observe())
    // const disableEscapeKey = disableEscapeKeyDown || lightboxImageOpened$?.opened
    const disableEscapeKey = disableEscapeKeyDown;

    return (
      <Dialog
        ref={ref}
        disableEscapeKeyDown={disableEscapeKey ?? false}
        className={clsx('CustomDialog-root', className)}
        sx={flatSx(rootSx, sx)}
        {...otherProps}
      />
    );
  },
);

CustomDialog.displayName = 'CustomDialog';
