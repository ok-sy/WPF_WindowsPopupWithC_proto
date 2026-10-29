import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { COMPONENTS, FUNCTIONS } from '../guideData';
import {
  GUIDE_NOTICES, NOTICE_CATEGORY_LABELS, NOTICE_STATUS_LABELS, RECENT_NOTICE_DAYS, isRecentNotice, type NoticeCategory,
} from '../guideNotices';
import { C, CODE_FONT, GUIDE_TAB_LABELS, Page, RichText, TabLink, type GuideNavigate } from '../GuideUi';

const CATEGORY_COLORS: Record<NoticeCategory, 'primary' | 'warning' | 'error' | 'info' | 'default'> = {
  ADDED: 'primary', CHANGED: 'warning', REMOVED: 'error', PLANNED: 'info', NOTICE: 'default',
};
const FUNCTION_NAMES = new Set(FUNCTIONS.flatMap((fn) => fn.name.split(' / ')));

/**
 * POL-14-01 : 공통 프론트 경계
 * ■ 가이드: 공지 탭
 * - in : now(Date) 최근 게시 판단 기준 시각 · onNavigate(tab, component?) 관련 탭·컴포넌트로 이동
 * - out: 화면: 구분 필터, 공지 카드(날짜·상태·본문·사용하는 쪽 할 일·영향 컴포넌트 링크·관련 탭 링크)
 * - 공지 데이터의 단일 출처는 guideNotices.ts다. 최근 게시 표시(NEW)는 게시일 기준이며 완료·실행 여부를 뜻하지 않는다.
 */
export default function GuideNoticeTab({ now, onNavigate }: { now: Date; onNavigate: GuideNavigate }) {
  const [category, setCategory] = useState<NoticeCategory | 'ALL'>('ALL');
  const notices = [...GUIDE_NOTICES]
    .filter((notice) => category === 'ALL' || notice.category === category)
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const categories = Object.keys(NOTICE_CATEGORY_LABELS) as NoticeCategory[];
  // 영향 이름이 컴포넌트면 컴포넌트 탭의 해당 항목으로, 함수면 변환·유틸 탭으로 이동한다. 둘 다 아니면 글자만 표시.
  const affected = (name: string) => {
    if (COMPONENTS.some((component) => component.name === name)) return () => onNavigate('component', name);
    if (FUNCTION_NAMES.has(name)) return () => onNavigate('function');
    return undefined;
  };
  return (
    <Page>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        <Chip label={`전체 ${GUIDE_NOTICES.length}`} color={category === 'ALL' ? 'primary' : 'default'} onClick={() => setCategory('ALL')} />
        {categories.map((item) => {
          const count = GUIDE_NOTICES.filter((notice) => notice.category === item).length;
          return count ? <Chip key={item} label={`${NOTICE_CATEGORY_LABELS[item]} ${count}`} color={category === item ? 'primary' : 'default'} onClick={() => setCategory(item)} /> : null;
        })}
      </Stack>
      {notices.map((notice) => (
        <Paper key={notice.id} variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, borderLeft: '4px solid',
          borderLeftColor: `${CATEGORY_COLORS[notice.category] === 'default' ? 'grey.400' : `${CATEGORY_COLORS[notice.category]}.main`}` }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip size="small" color={CATEGORY_COLORS[notice.category]} label={NOTICE_CATEGORY_LABELS[notice.category]} />
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{notice.title}</Typography>
            {isRecentNotice(notice.date, now) && <Chip size="small" color="error" label="NEW" title={`최근 ${RECENT_NOTICE_DAYS}일 안에 게시`} sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />}
          </Stack>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            {notice.date} 게시 · {NOTICE_STATUS_LABELS[notice.status]}{notice.doneDate ? ` (${notice.doneDate})` : ''}
          </Typography>
          <Stack spacing={0.75} sx={{ mt: 1.5 }}>
            {notice.body.map((line) => <Typography key={line} sx={{ fontSize: 14, lineHeight: 1.8 }}><RichText text={line} /></Typography>)}
          </Stack>
          {notice.action && (
            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 1.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9a3412' }}>사용하는 화면에서 할 일</Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.7, mt: 0.25 }}><RichText text={notice.action} /></Typography>
            </Box>
          )}
          {((notice.components && notice.components.length > 0) || notice.tab) && (
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              {notice.components && notice.components.length > 0 && <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>영향</Typography>}
              {notice.components?.map((name) => {
                const go = affected(name);
                return go
                  ? <Chip key={name} size="small" variant="outlined" label={name} onClick={go} sx={{ fontFamily: CODE_FONT, fontSize: 12.5 }} />
                  : <C key={name}>{name}</C>;
              })}
              {notice.tab && <TabLink label={`${GUIDE_TAB_LABELS[notice.tab]} 탭에서 보기`} onClick={() => notice.tab && onNavigate(notice.tab)} />}
            </Stack>
          )}
        </Paper>
      ))}
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
        공지는 <C>guide/guideNotices.ts</C>에 추가합니다. NEW는 최근 {RECENT_NOTICE_DAYS}일 안에 게시된 공지입니다.
      </Typography>
    </Page>
  );
}
