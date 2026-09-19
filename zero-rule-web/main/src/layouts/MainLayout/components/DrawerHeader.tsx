import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import type React from 'react';

export const DrawerHeader: React.FC<BoxProps> = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
}));
