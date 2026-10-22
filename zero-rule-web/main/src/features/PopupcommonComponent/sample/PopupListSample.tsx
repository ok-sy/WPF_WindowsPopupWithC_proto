import type { AdminPopupDetail } from '@local/domain';
import {
  Alert, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { useState } from 'react';
import { POPUP_TYPE_LABELS } from '../popupCommon';
import { createDefaultPopup, toSaveRequest, type PopupSaveRequest } from '../popupEditorTransform';
import PopupSampleEditor from './PopupSampleEditor';
import { createSamplePopups } from './popupSampleData';

/*
 * [TODO69] 기존 목록 기반 샘플(RgstPop 목록 → 신규/수정 → 편집기·두 미리보기 흐름). 관리자 API·인증 없이 동작한다.
 * 데이터 공급 경계: 목록은 createSamplePopups()(로컬), 저장은 toSaveRequest로 요청 객체만 만들고 메모리 목록을 바꾼다.
 * 실제 서버에 연결할 때는 목록을 api.popupAdmin.list, 편집 시작을 api.popupAdmin.info → toEditorPopup,
 * 저장을 api.popupAdmin.save(toSaveRequest(...))로 바꾼다(RgstPop.tsx·PopupEditorDialog.tsx가 실제 구현).
 */
export default function PopupListSample() {
  const [popups, setPopups] = useState<AdminPopupDetail[]>(createSamplePopups);
  const [editing, setEditing] = useState<{ popup: AdminPopupDetail; key: number } | null>(null);
  const [lastRequest, setLastRequest] = useState<PopupSaveRequest | null>(null);
  const open = (popup: AdminPopupDetail) => setEditing({ popup, key: Date.now() });

  const save = (popup: AdminPopupDetail) => {
    const request = toSaveRequest(popup, true, []);
    setLastRequest(request);
    setPopups((previous) => previous.some((item) => item.popupId === popup.popupId)
      ? previous.map((item) => (item.popupId === popup.popupId ? popup : item))
      : [...previous, popup]);
    setEditing(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>팝업 공통 컴포넌트 샘플 — 목록</Typography>
        <Button variant="contained" size="small"
          onClick={() => open({ ...createDefaultPopup(), popupId: `LOCAL-${popups.length + 1}`, title: '새 팝업' })}>신규</Button>
      </Stack>
      <Alert severity="info" sx={{ mb: 1.5 }}>서버 없이 확인하는 샘플입니다. 저장은 이 화면 메모리에만 반영되고 DB에는 저장되지 않습니다.</Alert>
      <Paper variant="outlined">
        <Table size="small" aria-label="샘플 팝업 목록">
          <TableHead><TableRow><TableCell>팝업 ID</TableCell><TableCell>유형</TableCell><TableCell>제목</TableCell><TableCell>크기</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {popups.map((popup) => (
              <TableRow key={popup.popupId} hover>
                <TableCell>{popup.popupId}</TableCell>
                <TableCell>{popup.popupType === 'QUIZ' && popup.content.videoEnabled === true ? '영상 + 퀴즈' : POPUP_TYPE_LABELS[popup.popupType]}</TableCell>
                <TableCell>{popup.title}</TableCell>
                <TableCell>{popup.width ?? '원본'} × {popup.height ?? '원본'}</TableCell>
                <TableCell align="right"><Button size="small" onClick={() => open(popup)}>수정</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {lastRequest && <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">마지막 저장 요청 객체(toSaveRequest 결과, 서버 미전송)</Typography>
        <Box component="pre" data-testid="sample-save-request" sx={{ m: 0, p: 1.5, maxHeight: 280, overflow: 'auto', bgcolor: 'grey.100', fontSize: 12 }}>
          {JSON.stringify(lastRequest, null, 2)}
        </Box>
      </Box>}
      {editing && <PopupSampleEditor key={editing.key} initial={editing.popup} open onClose={() => setEditing(null)} onSave={save} />}
    </Box>
  );
}
