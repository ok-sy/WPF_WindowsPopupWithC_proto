import type { AdminPopupDetail } from '@local/domain';
import {
  Alert, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { useState } from 'react';
import { POPUP_TYPE_LABELS } from '../popupCommon';
import { toSaveRequest, type PopupSaveRequest } from '../popupEditorTransform';
import PopupSampleEditor from './PopupSampleEditor';
import { createSamplePopups, newSamplePopup } from './popupSampleData';

/**
 * POL-14-01 : 공통 프론트 경계
 * POL-07-01 : 부모의 데이터 소유
 * ■ 팝업 목록 샘플 화면
 * - in : 데이터 공급 createSamplePopups()(로컬 샘플 목록) · 신규 기본값 newSamplePopup()
 * - out: 저장 요청 toSaveRequest(popup, true, []) 결과(서버 미전송, 화면에 표시) · 화면: 팝업 목록 표·신규/수정 버튼·PopupSampleEditor 편집 대화상자
 * - 샘플 팝업 목록을 받아 신규/수정 → 편집기·두 미리보기 흐름(RgstPop 목록과 같은 흐름)을 관리자 API·인증 없이 보여 준다.
 * 데이터 공급 경계: 목록은 createSamplePopups()(로컬), 저장은 toSaveRequest로 요청 객체만 만들고 메모리 목록을 바꾼다.
 * 실제 서버에 연결할 때는 목록을 api.popupAdmin.list({ ctx }), 편집 시작을 api.popupAdmin.info({ popupId }) → toEditorPopup(body.popup),
 * 저장을 api.popupAdmin.save(toSaveRequest(...))로 바꾼다(RgstPop.tsx·PopupEditorDialog.tsx가 실제 구현).
 * 인수인계 가이드: docs/interfaces/POPUP_FRONT_SAMPLE_HANDOVER.md (선언 이유·로직·옵션·옵션 추가/삭제 예시·실연동 교체 지점).
 * 주석 표식: [옵션] = 바꿔도 되는 값, [실연동] = 실제 서버에 붙일 때 바꾸는 곳.
 */
export default function PopupListSample() {
  // [실연동] 초기 목록. useEffect에서 api.popupAdmin.list({ ctx })의 body로 채운다(목록 항목 → 수정 시 info로 상세 조회).
  const [popups, setPopups] = useState<AdminPopupDetail[]>(createSamplePopups);
  const [editing, setEditing] = useState<{ popup: AdminPopupDetail; key: number } | null>(null);
  const [lastRequest, setLastRequest] = useState<PopupSaveRequest | null>(null);
  // 열 때마다 새 key로 편집기를 마운트해 이전 팝업의 편집 상태·에디터 내용이 섞이지 않게 한다.
  // [실연동] 수정 시작: api.popupAdmin.info({ popupId }) → toEditorPopup(body.popup)을 넘긴다.
  const open = (popup: AdminPopupDetail) => setEditing({ popup, key: Date.now() });

  const save = (popup: AdminPopupDetail) => {
    // [실연동] active·targetGroups는 등록 화면의 활성 스위치·대상 그룹 입력값. 이후 api.popupAdmin.save(request) 성공 시에만 목록을 갱신한다.
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
        {/* [옵션] 신규 기본값은 newSamplePopup() = createDefaultPopup()(창 560×420·최소 300×300 등) + 전체 content 옵션. [실연동] popupId는 서버 채번/입력 규칙으로 바꾼다. */}
        <Button variant="contained" size="small"
          onClick={() => open(newSamplePopup(`LOCAL-${popups.length + 1}`, '새 팝업'))}>신규</Button>
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
