import type { CLUser } from '@local/domain';
import { CLUserState } from '@local/domain';
import { formatEpochSeconds } from '@local/ui';
import { Box, Chip, TableCell, TableRow, Typography } from '@mui/material';
import TimeAgo from 'timeago-react';

type Props = {
  user: CLUser;
  onClickRow: (userId: number) => void; // 나중엔 유저 아이디만 보내자~
};

export default function UserTableRow(props: Props) {
  const { user, onClickRow } = props;
  const { userId, lgonId, userState, userNm, lastLgonDttm, teamId } = user;
  // 최종 로그인 시간
  const [lastLgonDttmStr, lastLgonDttmDate] = lastLgonDttm ? formatEpochSeconds(lastLgonDttm) : [];
  return (
    <TableRow className="UserListRow-root" onClick={(e) => onClickRow(userId)}>
      <TableCell>{lgonId}</TableCell>
      <TableCell>{userNm}</TableCell>
      <TableCell>
        <Chip
          label={CLUserState[userState]}
          variant="outlined"
          color={userState === 'ACTIVE' ? 'success' : 'warning'}
          size="small"
          sx={{
            fontSize: '0.7rem',
          }}
        />
      </TableCell>
      <TableCell>
        {lastLgonDttmDate && (
          <Box>
            <Typography variant="caption">
              <TimeAgo datetime={lastLgonDttmDate} locale="ko" />
            </Typography>
          </Box>
        )}
        {lastLgonDttmStr && <Typography>{lastLgonDttmStr}</Typography>}
        {!lastLgonDttm && '-'}
      </TableCell>
    </TableRow>
  );
}
