import type { ReactNode } from 'react';
import React, { useRef, useState, useEffect } from 'react';
import type { TypographyProps } from '@mui/material';
import { Box, Tooltip, Typography } from '@mui/material';
import { getTruncatedTitle } from '@/lib/cwOverTextCustom';

type TextOverFieldProps = {
  text: string;
  maxWidth: number;
  fontSize?: string;
  children?: ReactNode;
  textAlign?: string;
} & TypographyProps;

const TextOverField: React.FC<TextOverFieldProps> = ({
  text,
  maxWidth,
  fontSize = '15px',
  textAlign = 'left',
  children,
  ...rest
}) => {
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(maxWidth);
  const [isTruncated, setIsTruncated] = useState<boolean>(false);
  const [truncatedText, setTruncatedText] = useState<string>(text);

  useEffect(() => {
    if (textContainerRef.current) {
      const width = textContainerRef.current.clientWidth;
      setContainerWidth(width);
      const truncated = getTruncatedTitle(text, width);
      setTruncatedText(truncated);
      setIsTruncated(truncated !== text);
    }
  }, [text, maxWidth]);

  return (
    <Box
      ref={textContainerRef}
      sx={{
        maxWidth: `${maxWidth}px`,
        minWidth: `${maxWidth}px`,
        textAlign: textAlign,
        fontSize: fontSize,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {isTruncated ? (
        <Tooltip title={text} arrow>
          <Typography {...rest}>{truncatedText + '...'}</Typography>
        </Tooltip>
      ) : (
        <Typography {...rest}>{text}</Typography>
      )}
      {children}
    </Box>
  );
};

export default TextOverField;
