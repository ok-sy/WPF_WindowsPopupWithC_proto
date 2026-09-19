import PopupPreview from '@/features/RgstPop/PopupPreview';
import type { AdminPopupDetail } from '@local/domain';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const PopupPreviewPage: NextPage = () => {
  const router = useRouter();
  const [popup, setPopup] = useState<AdminPopupDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const key = typeof router.query.key === 'string' ? router.query.key : '';
    if (!key) {
      setError('미리보기 데이터가 없습니다.');
      return;
    }

    const rawPopup = localStorage.getItem(key);
    localStorage.removeItem(key);
    if (!rawPopup) {
      setError('미리보기 데이터가 만료되었거나 없습니다.');
      return;
    }

    try {
      setPopup(JSON.parse(rawPopup) as AdminPopupDetail);
    } catch {
      setError('미리보기 데이터를 읽을 수 없습니다.');
    }
  }, [router.isReady, router.query.key]);

  if (popup) {
    return <PopupPreview popup={popup} standalone onClose={() => window.close()} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#e9edf4' }}>
      {error ? <Typography color="error">{error}</Typography> : <CircularProgress />}
    </Box>
  );
};

export default PopupPreviewPage;
