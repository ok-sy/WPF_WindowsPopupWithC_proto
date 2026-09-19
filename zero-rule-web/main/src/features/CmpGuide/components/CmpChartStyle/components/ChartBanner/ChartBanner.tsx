import { Box, Stack, Switch, Typography } from '@mui/material';
import { rootSx } from './style';
type Props = {
  setTime: (el: number) => void;
  time: number;
};
export default function ChartBanner(props: Props) {
  return (
    <Box sx={rootSx} className="ChartBanner-root">
      <Box>
        <Stack alignItems="baseline" spacing={1} direction="row">
          <Typography className="ChartBanner-title2" variant="h1">
            Chart
          </Typography>
          <Typography className="ChartBanner-title1" variant="h1">
            Library
          </Typography>
        </Stack>
        <Typography variant="subtitle1">
          CLOVER 프레임워크에서 공통적으로 사용할 수 있는 차트 메뉴얼입니다.
          <br />
          자세한 컴포넌트 속성은 소스코드에서 확인할 수 있습니다.
        </Typography>
      </Box>
      <Stack direction="row" alignItems="center">
        <Typography variant="h5">데이터 움직임</Typography>
        <Switch
          checked={props.time === 2000}
          onChange={(e, checked) => {
            if (checked) {
              props.setTime(2000);
            } else {
              props.setTime(7575);
            }
          }}
        />
      </Stack>
    </Box>
  );
}
