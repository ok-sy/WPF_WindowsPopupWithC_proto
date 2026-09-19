import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { Avatar, Box, LinearProgress, Stack } from '@mui/material';
import clsx from 'clsx';
import numeral from 'numeral';
import { useRef } from 'react';
import { useCountUp } from 'react-countup';
import type { ItemType } from '../../todays-sample';

export default function MyBox(props: { className?: string; item: ItemType }) {
  const { className, item } = props;
  const { title, count, delta, dataType } = item;
  const countRef = useRef<HTMLHeadingElement>(null);
  const overseaCountRef = useRef<HTMLHeadingElement>(null);
  function formatNum(value: number): string {
    if (dataType === 'K') return numeral(value).format('0.0a');
    if (dataType === 'money') return numeral(value).format('$0,000a');
    if (dataType === 'percent') return numeral(value / 100000).format('0.00%');
    return value.toLocaleString();
  }
  useCountUp({
    ref: countRef,
    startOnMount: true,
    start: 0,
    end: count,
    duration: 0.7,
    formattingFn: formatNum,
  });
  useCountUp({
    ref: overseaCountRef,
    startOnMount: true,
    start: 0,
    end: count - 25000,
    duration: 0.7,
    formattingFn: formatNum,
  });

  const color = delta >= 0 ? 'rgb(240, 68, 56)' : 'rgb(16, 185, 129)';
  return (
    <Box
      className={clsx('MyBox-root', className)}
      sx={{
        height: '100%',
        position: 'relative',
        minWidth: 250,
        background: 'rgb(255, 255, 255)',
        borderRadius: '20px',
        boxShadow: 'rgba(0,0,0,0.04) 0px 5px 22px ,rgba(0,0,0,0.03) 0px 0px 0px 0.5px',
        py: 3,
        px: 3,
        '& h1,& h5,& h6,& h4': {
          m: 0,
          p: 0,
        },
        '& h1': {
          fontSize: '2rem',
          lineHeight: 1.2,
          fontWeight: 700,
          pt: 1.5,
        },
        '& h5': {
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.5px',
          lineHeight: 2.5,
          textTransform: 'uppercase',
          color: 'rgb(108, 115, 127)',
        },
        '& .MuiAvatar-root': {
          width: 56,
          height: 56,
          backgroundColor: item.color,
        },
        '& h6': {
          fontSize: '0.875rem',
          fontWeight: 200,
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="column" justifyContent="space-between">
          <h5>{title}</h5>
          <h1 ref={countRef} />
        </Stack>
        <Avatar>{item.icon}</Avatar>
      </Stack>
      {/* 델타 증감표를 나타냄 사용될지 안될지 모름 */}
      {dataType !== 'percent' ? (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2.5, color }}>
          <Box
            sx={{
              color: color,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {delta > 0 ? (
              <NorthIcon sx={{ fontSize: '1rem' }} />
            ) : (
              <SouthIcon sx={{ fontSize: '1rem' }} />
            )}
          </Box>
          <h6>
            {delta > 0 ? '+' : ''}
            {delta.toLocaleString()}
          </h6>
        </Stack>
      ) : (
        <Box sx={{ pt: 4 }}>
          <LinearProgress color="warning" variant="buffer" value={count / 1000} />
        </Box>
      )}
    </Box>
  );
}
