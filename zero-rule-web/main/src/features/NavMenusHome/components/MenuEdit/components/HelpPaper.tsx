import { flatSx } from '@local/ui';
import type { SxProps, Theme } from '@mui/material';
import { Paper, Stack } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
const rootSx: SxProps<Theme> = {
  whiteSpace: 'nowrap',
  py: 3,
  pr: 2,
  top: 19,
  borderRadius: 1,
  backgroundColor: '#696a6f60',
  backdropFilter: 'blur(8px)',
  position: 'absolute',
  zIndex: 9999,
};

interface Props {}
export default function HelpPaper(props: Props) {
  return (
    <Paper>
      <Stack
        spacing={0.5}
        component="ul"
        sx={flatSx(rootSx, {
          em: {
            color: 'secondary.main',
            fontStyle: 'normal',
          },
        })}
        className="HelpPaper-root"
      >
        <li>
          <em>드래그</em>를 이용해 <em>전체 메뉴</em>를 구성해주세요.
        </li>
        <li>그룹은 다른 그룹에 넣을 수 없습니다.</li>
        <li>
          페이지에 <em>다른</em> 페이지나 그룹을 넣을 수 없습니다.
        </li>
        <li>
          이동, 새로고침 시 <em>변경사항</em>이 저장되지 않을 수 있습니다.
        </li>
        <li>
          <em>정보버튼</em>
          <InfoOutlinedIcon sx={{ width: 15, fontSize: 13 }} />이 보이면 <em>그룹</em>입니다.
        </li>
      </Stack>
    </Paper>
  );
}
