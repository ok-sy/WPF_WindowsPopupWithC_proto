import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material';

type Props = {
  title: React.ReactNode;
  loading?: boolean;
  onClickRefresh?: (event: React.MouseEvent) => void;
};

export function TitleWithReloadButton(props: Props) {
  const { title, loading, onClickRefresh } = props;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-start">
      {typeof title === 'string' && <Typography variant="h5">{title}</Typography>}
      {typeof title !== 'string' && title}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 40,
        }}
      >
        {!loading && onClickRefresh && (
          <IconButton size="small" color="primary" onClick={onClickRefresh}>
            <RefreshIcon />
          </IconButton>
        )}

        {loading && <CircularProgress size="1rem" color="primary" />}
      </Box>
    </Stack>
  );
}
