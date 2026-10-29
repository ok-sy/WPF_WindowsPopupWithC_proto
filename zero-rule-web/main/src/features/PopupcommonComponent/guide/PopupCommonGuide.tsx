import { Badge, Box, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import GuideSavePartsTab from './GuideSavePartsTab';
import { GUIDE_NOTICES, isRecentNotice } from './guideNotices';
import { GUIDE_TAB_LABELS, type GuideNavigate, type GuideTabId } from './GuideUi';
import GuideComponentTab from './tabs/GuideComponentTab';
import GuideExampleTab from './tabs/GuideExampleTab';
import GuideFunctionTab from './tabs/GuideFunctionTab';
import GuideLiveTab from './tabs/GuideLiveTab';
import GuideNoticeTab from './tabs/GuideNoticeTab';
import GuideProcessTab from './tabs/GuideProcessTab';
import GuideStartTab from './tabs/GuideStartTab';

/* 탭 순서. 첫 진입은 시작하기, 공지는 맨 뒤(최근 게시 수 배지로 발견성 유지). */
const TAB_ORDER: GuideTabId[] = ['start', 'process', 'component', 'saveParts', 'example', 'function', 'live', 'notice'];

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ PopupcommonComponent 가이드 화면(컨테이너)
 * - in : 없음(설명은 guideData.ts, 공지는 guideNotices.ts, 탭 화면은 tabs/·GuideSavePartsTab.tsx)
 * - out: 화면: 시작하기·사용 순서·컴포넌트·다른 화면에서 사용하기·예시·데이터 처리 함수·실습·공지 탭
 * - 탭 배치·선택 상태·공지 배지만 맡는다. 탭을 바꾸면 해당 탭을 새로 마운트한다(실습 입력·실행기 입력이 처음 값으로 돌아가는 것이 의도한 동작).
 *   서버 API를 호출하지 않는다. 사이드바 메뉴: db/oracle/20_popup_common_guide_menu_oracle.sql.
 */
export default function PopupCommonGuide() {
  const [tab, setTab] = useState<GuideTabId>('start');
  // 공지 링크로 컴포넌트 탭을 열 때 선택할 컴포넌트. key로 컴포넌트 탭을 다시 마운트해 선택을 적용한다.
  const [focus, setFocus] = useState<{ component?: string; key: number }>({ key: 0 });
  const [now] = useState(() => new Date());
  const recentCount = GUIDE_NOTICES.filter((notice) => isRecentNotice(notice.date, now)).length;
  const navigate: GuideNavigate = (next, component) => {
    if (next === 'component') setFocus((previous) => ({ component, key: previous.key + 1 }));
    setTab(next);
    document.getElementById('popup-common-guide-top')?.scrollIntoView({ block: 'start' });
  };
  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5, overflow: 'auto', height: '100%', bgcolor: '#fafbfc' }}>
      <Typography id="popup-common-guide-top" component="h2" sx={{ fontSize: 22, fontWeight: 700 }}>PopupcommonComponent 가이드</Typography>
      <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>팝업 입력·미리보기 컴포넌트를 다른 화면에서 쓰는 방법과 변경 공지</Typography>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto"
        sx={{ mt: 2, mb: 3, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontSize: 15, fontWeight: 600, minWidth: 96 } }}>
        {TAB_ORDER.map((id) => (
          <Tab key={id} value={id} label={id === 'notice'
            ? <Badge color="error" badgeContent={recentCount} sx={{ pr: recentCount ? 1.5 : 0 }}>{GUIDE_TAB_LABELS[id]}</Badge>
            : GUIDE_TAB_LABELS[id]} />
        ))}
      </Tabs>
      {tab === 'start' && <GuideStartTab onNavigate={navigate} />}
      {tab === 'process' && <GuideProcessTab />}
      {tab === 'component' && <GuideComponentTab key={focus.key} initial={focus.component} />}
      {tab === 'saveParts' && <GuideSavePartsTab />}
      {tab === 'example' && <GuideExampleTab />}
      {tab === 'function' && <GuideFunctionTab />}
      {tab === 'live' && <GuideLiveTab />}
      {tab === 'notice' && <GuideNoticeTab now={now} onNavigate={navigate} />}
    </Box>
  );
}
