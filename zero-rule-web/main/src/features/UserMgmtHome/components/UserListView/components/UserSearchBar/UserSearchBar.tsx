import type { SxProps } from '@mui/material';
import { Box, Button, Paper, Stack, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'react-use';

export const rootSx: SxProps = {
  whiteSpace: 'nowrap',
  mb: 2,
  width: '100%',
  maxWidth: 'md',
  position: 'relative',
  '& .MuiTextField-root': {
    '& .MuiInputBase-root': { borderRadius: 0 },
    width: '100%',
  },
};

type Props = {
  loading: boolean;
  onSubmit: (lgonId?: string, userNm?: string) => void;
  handleClickSearchBtn: () => void;
  resetBtn: () => void;
};

export default function UserSearchBar(props: Props) {
  const { loading, onSubmit, handleClickSearchBtn, resetBtn } = props;

  const [userNm, setUserNm] = useState<string>();
  const [debouncedUserNm, setDebouncedUserNm] = useState<string>();

  const [lgonId, setLgonId] = useState<string>();
  const [debouncedLgonId, setDebouncedLgonId] = useState<string>();

  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;

  useEffect(() => {
    onSubmitFnRef.current?.(undefined, debouncedUserNm);
  }, [debouncedUserNm]);
  useEffect(() => {
    onSubmitFnRef.current?.(debouncedLgonId, undefined);
  }, [debouncedLgonId]);

  useDebounce(() => setDebouncedUserNm(userNm), 500, [userNm]);
  useDebounce(() => setDebouncedLgonId(lgonId), 500, [lgonId]);

  return (
    <Box sx={rootSx} className="UserSearchBar-root">
      <Paper square variant="outlined" sx={{}}>
        <Stack
          spacing={2}
          sx={{
            py: 3,
            pl: 3,
            pr: 2,
          }}
          direction="column"
        >
          <TextField
            sx={{ maxWidth: '45%' }}
            size="small"
            label="USER 아이디"
            fullWidth
            type="search"
            placeholder="ex) master"
            onChange={(e) => setLgonId(e.target.value)}
          />
          <TextField
            sx={{ maxWidth: '45%' }}
            size="small"
            label="USER 이름"
            fullWidth
            type="search"
            placeholder="ex) 홍길동"
            onChange={(e) => setUserNm(e.target.value)}
          />
        </Stack>
      </Paper>
      <Stack mt={1} spacing={1} justifyContent="center" direction="row">
        <Button sx={{ height: 30 }} size="small" variant="contained" onClick={handleClickSearchBtn}>
          검색
        </Button>
        <Button sx={{ height: 30 }} size="small" variant="outlined" onClick={resetBtn}>
          리셋
        </Button>
      </Stack>
    </Box>
  );
}
