import useCustomTheme from '@/hooks/useCustomTheme';
import { ThemeProvider } from '@mui/material';

type Props = {
  children?: React.ReactNode;
};

/**
 * 테마를 handling 하기 위해 만든 Component
 * 코드 복잡도 감소!!
 */
export default function CustomThemeWrapper(props: Props) {
  const [theme, _setPaletteFn] = useCustomTheme();

  const { children } = props;
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
