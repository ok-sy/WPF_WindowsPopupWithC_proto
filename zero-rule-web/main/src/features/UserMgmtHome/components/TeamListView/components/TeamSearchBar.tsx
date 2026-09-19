import type { SxProps } from '@mui/material';
import { Box, Button, Stack, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'react-use';
type Props = {
  loading: boolean;
  onSubmit: (option?: string) => void;
};

const rootSx: SxProps = {
  display: 'flex',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  mb: 2,
};

export default function TeamSearchBar(props: Props) {
  const { loading, onSubmit } = props;
  const [keyword, setKeyword] = useState<string>();
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>();
  const onSubmitFnRef = useRef<Props['onSubmit']>();
  onSubmitFnRef.current = onSubmit;
  useEffect(() => {
    onSubmitFnRef.current?.(debouncedKeyword);
  }, [debouncedKeyword]);

  useDebounce(() => setDebouncedKeyword(keyword), 500, [keyword]);

  return (
    <Box sx={rootSx} className="TeamSearchBar-root">
      <Stack direction="row" width={450} textAlign="center">
        <TextField
          onChange={(e) => setKeyword(e.target.value)}
          fullWidth
          sx={{ backgroundColor: '#fff' }}
          label="팀 이름 검색"
          size="small"
          placeholder="ex) 총무팀"
        />
        <Button sx={{ ml: 1 }} size="small" variant="contained">
          검색
        </Button>
      </Stack>
    </Box>
  );
}
