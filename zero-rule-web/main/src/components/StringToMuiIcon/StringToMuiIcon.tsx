import type { IconNames } from './MuiGenericIcon';
import { MuiGenericIcon } from './MuiGenericIcon';
import { Box } from '@mui/material';
interface Props {
  iconName: string;
  iconColor?: string;
}
/**
 * @Author jinwoo
 * 문자열을 받아 아이콘형태로 변환해주는 컴포넌트 입니다.
 *
 * @param param0  Mui아이콘 라이브러리의 맨뒤 Icon이 제거된 형태의 문자열
 * @returns IconComponent
 */
export const StringToMuiIcon = ({ iconName, iconColor }: Props): JSX.Element => {
  if (iconName === '' || undefined) return <div></div>;
  return (
    <Box
      sx={{
        '& .MuiSvgIcon-root': {
          color: iconColor,
        },
      }}
    >
      <MuiGenericIcon iconName={iconName as IconNames} />
    </Box>
  );
};
