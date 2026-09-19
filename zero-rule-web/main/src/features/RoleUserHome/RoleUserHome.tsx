import type { CLUser } from '@local/domain';
import { Box, Grid2, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import UserList from './components/UserList';
import UserPrivList from './components/UserPrivList';
import UserRoleList from './components/UserRoleList';

export default function RoleUserHome() {
  const [selectedUser, setSelectedUser] = useState<CLUser>();

  return (
    <Box
      sx={{
        py: 1,
        pl: 1,
        pr: 3,
      }}
    >
      <Grid2 container columnSpacing={2}>
        <Grid2 size={{ xs: 12, md: 3 }}>
          {
            <UserList
              selectedId={selectedUser?.userId}
              onSelectedUser={(user) => setSelectedUser(user)}
            />
          }
        </Grid2>
        <Grid2 size={{ xs: 12, md: 9 }}>
          {selectedUser ? (
            <Stack direction="row" spacing={1}>
              <UserRoleList userId={selectedUser.userId} userNm={selectedUser.userNm} />
              <UserPrivList userId={selectedUser.userId} />
            </Stack>
          ) : (
            <Stack sx={{ height: '100%' }} alignItems="center" justifyContent="center">
              <Typography variant="h4" color="GrayText">
                검색결과 없음
              </Typography>
            </Stack>
          )}
        </Grid2>
      </Grid2>
    </Box>
  );
}
