import type { PaletteColor, Theme } from '@mui/material';
import { createTheme, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { useLocalStorage } from 'react-use';

const STORAGE_KEY = '__fds_custom_theme';

export const DEFAULT_CUSTOM_PALETTE: PaletteColor = {
  main: '#3f51b5',
  contrastText: '#fff',
  dark: '#002984',
  light: '#757de8',
};

function generateTheme(defaultTheme: Theme, newPaletteColor: PaletteColor) {
  const palette = { ...defaultTheme.palette, primary: newPaletteColor };
  return createTheme({
    ...defaultTheme,
    palette,
  });
}

type SetPaletteFn = (color: PaletteColor) => void;

export default function useCustomTheme(): [Theme, SetPaletteFn] {
  const defaultTheme = useTheme();
  const [customPalette, setCustomPalette] = useLocalStorage<PaletteColor>(
    STORAGE_KEY,
    DEFAULT_CUSTOM_PALETTE,
  );
  const customTheme = useMemo(
    () => generateTheme(defaultTheme, customPalette ?? DEFAULT_CUSTOM_PALETTE),
    [customPalette, defaultTheme],
  );
  return [customTheme, setCustomPalette];
}
