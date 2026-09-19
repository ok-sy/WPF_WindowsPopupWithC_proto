import { flatSx } from '@local/ui';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import type { SxProps } from '@mui/material';
import { Box, IconButton, Tooltip } from '@mui/material';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useCopyToClipboard } from 'react-use';

type Props = {
  sx?: SxProps;
  className?: string;
  textProviderFunc: () => string | undefined | null;
};

export default function ClipboardButton(props: Props) {
  const { sx, className } = props;
  const [msgVisible, setMsgVisible] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();
  const textProviderFuncFn = useRef<Props['textProviderFunc']>();
  textProviderFuncFn.current = props.textProviderFunc;

  const handleCopyButtonClick = () => {
    const text = textProviderFuncFn.current?.();
    if (text && text.length > 0) {
      copyToClipboard(text);
      setMsgVisible(true);
    }
  };

  useEffect(() => {
    if (!msgVisible) return;
    setMsgVisible(true);
    const timer = setTimeout(() => {
      setMsgVisible(false);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [msgVisible]);

  return (
    <Box
      className={clsx('ClipboardButton-root', className)}
      sx={flatSx(
        {
          position: 'relative',
          display: 'inline-block',
        },
        sx,
      )}
    >
      <Tooltip title="copy to clipboard">
        <IconButton
          size="small"
          onClick={handleCopyButtonClick}
          disabled={msgVisible}
          sx={{ opacity: msgVisible ? 0 : 1 }}
        >
          <FileCopyIcon style={{ fontSize: '1rem' }} />
        </IconButton>
      </Tooltip>
      {msgVisible && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 'auto',
            fontSize: '0.6rem',
            color: '#999',
            transform: 'rotate(-45deg)',
          }}
        >
          Copied
        </span>
      )}
    </Box>
  );
}
