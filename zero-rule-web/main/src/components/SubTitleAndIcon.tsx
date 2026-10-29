import StopOutlinedIcon from '@mui/icons-material/StopOutlined';
import type { StackProps } from '@mui/material';
import { Stack, Typography } from '@mui/material';

type Props = {
  labelTitle: string;
} & StackProps;
/**
 * @Author jinWoo
 * 공통코드 타입과 공통코드 번호를 받아 그에맞는 코드 이름을 Typograpy로 출력하는 컴포넌트
 * @param props
 * @returns
 */
export default function SubTitleAndIcon(props: Props) {
  // labelTitle은 제목 글자로만 쓰고 Stack(DOM)으로 넘기지 않는다(넘기면 React unknown prop 경고).
  const { sx, className, labelTitle, ...rest } = props;

  return (
    <Stack direction="row" alignItems="center" {...rest}>
      <StopOutlinedIcon sx={{ ml: 1, mr: 0.5 }} color="info" fontSize="small" />
      <Typography variant="h6" sx={{ ...sx }}>
        {labelTitle}
      </Typography>
    </Stack>
  );
}
