import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { AdminPopupInfo, AdminPopupListItem } from '@local/domain';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, List, ListItemButton, ListItemText, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

const types: Record<string, string> = { TEXT: '텍스트', IMAGE: '이미지', VIDEO: '영상', SURVEY: '설문', QUIZ: '퀴즈' };

export default function PopupTemplateDialog({ open, onClose, onSelect }: {
  open: boolean;
  onClose: () => void;
  onSelect: (info: AdminPopupInfo) => void;
}) {
  const api = useApi();
  const [items, setItems] = useState<AdminPopupListItem[]>([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const request = ++generation.current;
    if (!open) return;
    setQuery(''); setType(''); setItems([]); setLoading(true); setFailed(false);
    api.popupAdmin.list().then(({ body }) => {
      if (generation.current === request) setItems(body.popups);
    }).catch((error) => {
      if (generation.current === request) { setFailed(true); handleError(error); }
    }).finally(() => { if (generation.current === request) setLoading(false); });
    return () => { generation.current++; };
  }, [open, api, retry]);
  const select = async (popupId: string) => {
    if (loading) return;
    const request = generation.current;
    setLoading(true);
    try {
      const { body } = await api.popupAdmin.info({ popupId });
      if (generation.current === request) onSelect(body);
    } catch (error) { if (generation.current === request) handleError(error); }
    finally { if (generation.current === request) setLoading(false); }
  };
  const filtered = items.filter((item) => (!type || item.popupType === type) && `${item.title} ${item.popupId}`.toLowerCase().includes(query.toLowerCase()));
  return <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>팝업 템플릿 불러오기</DialogTitle>
    {loading && <LinearProgress />}
    <DialogContent dividers>
      <Stack spacing={2}>
        <Typography color="text.secondary">등록된 팝업을 선택하면 제목·유형·문항·콘텐츠·표시 설정·대상 조건을 에디터에 덮어씁니다. 현재 팝업 ID와 활성 여부는 유지되며, 저장 버튼을 눌러야 반영됩니다.</Typography>
        <Stack direction="row" spacing={1}>
          <TextField fullWidth label="제목 / 팝업 ID 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          <TextField select label="유형" value={type} sx={{ minWidth: 110 }} onChange={(e) => setType(e.target.value)}>
            <MenuItem value="">전체</MenuItem>{Object.entries(types).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
        </Stack>
        {failed ? <Button onClick={() => setRetry((n) => n + 1)}>목록 다시 불러오기</Button> : !loading && !filtered.length && <Typography>불러올 팝업이 없습니다.</Typography>}
        <List>{filtered.map((item) => <ListItemButton key={item.popupId} disabled={loading} onClick={() => void select(item.popupId)}>
          <ListItemText primary={item.title} secondary={`${types[item.popupType]} · ${item.popupId}`} />
        </ListItemButton>)}</List>
      </Stack>
    </DialogContent>
    <DialogActions><Button disabled={loading} onClick={onClose}>닫기</Button></DialogActions>
  </Dialog>;
}
