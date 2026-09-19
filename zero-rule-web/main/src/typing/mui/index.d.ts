import type { SimplePaletteColorOptions, PaletteColor } from '@mui/material/styles';
import { PaletteColorOptions, PaletteOptions, Palette } from '@mui/material/styles';
declare module '@mui/material/styles' {
  //   interface Theme {
  //     status: {
  //       danger: React.CSSProperties['color']
  //     }
  //   }

  // palette.custom(style.ts에서 사용하는 부분)
  interface Palette {
    custom: PaletteColor;
  }

  // palette.custom(설정할때 사용하는 부분)
  interface PaletteOptions {
    // custom?: PaletteColorOptions
    custom?: SimplePaletteColorOptions;
  }

  //   interface PaletteColor {
  //     darker?: string
  //   }
  //   interface SimplePaletteColorOptions {
  //     darker?: string
  //   }
  //   interface ThemeOptions {
  //     status: {
  //       danger: React.CSSProperties['color']
  //     }
  //   }
}
