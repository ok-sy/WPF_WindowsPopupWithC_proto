import type { AdminPopupDetail } from '@local/domain';
import { plainTextToBlocks, readTextBlocks, type RichBlock } from './popupRichText';
import { richBlocksOrNull } from './PopupRichBlocks';

/**
 * POL-05-01 : 재생 경로
 * ■ 동영상·동영상+퀴즈 고정 설명 문구(2026-11-24)
 * - 동영상(VIDEO)과 동영상+퀴즈(QUIZ videoEnabled) 설명 맨 앞에 붙는 VMware 사운드 조절 안내. 오른쪽 정렬 문단으로 붙는다.
 * - 웹 등록 화면이 미리보기·저장 값(effective)을 만들 때만 붙이고(applyVideoFixedDescription), 불러올 때 떼어 낸다(stripVideoFixedDescription).
 *   그래서 에디터에는 사용자 입력만 보이고, 저장된 descriptionBlocks·description에는 고정 문구가 들어가 WPF는 받은 그대로 그린다(WPF에 문구 없음).
 * - ※·≡·→ 기호는 맑은 고딕·굴림·돋움에 글리프가 있다(Segoe UI에 없는 ※는 한글 글꼴로 대체 표시).
 * - 문구를 바꾸면 이미 저장된 팝업에는 이전 문구가 남는다. 이전 문구도 떼어 내려면 PREVIOUS_VIDEO_FIXED_DESCRIPTIONS에 추가한다.
 */
export const VIDEO_FIXED_DESCRIPTION = '※ 소리가 작다면 VMware 공간 외부 설정에서 볼륨을 올려 주세요.';
/** 예전에 저장된 고정 문구(불러올 때 함께 떼어 낸다). */
export const PREVIOUS_VIDEO_FIXED_DESCRIPTIONS: readonly string[] = [];

const FIXED_TEXTS = [VIDEO_FIXED_DESCRIPTION, ...PREVIOUS_VIDEO_FIXED_DESCRIPTIONS];

/** 고정 문구를 붙이는 대상: 동영상, 동영상+퀴즈. */
export function hasVideoFixedDescription(popup: Pick<AdminPopupDetail, 'popupType' | 'content'>): boolean {
  return popup.popupType === 'VIDEO' || (popup.popupType === 'QUIZ' && popup.content?.videoEnabled === true);
}

const blockText = (block: RichBlock) => block.runs.map((run) => run.text).join('');
const isFixedBlock = (block: RichBlock | undefined) => block != null && FIXED_TEXTS.includes(blockText(block).trim());

function stripFixedPlain(text: string): string {
  for (const fixed of FIXED_TEXTS) {
    if (text === fixed) return '';
    if (text.startsWith(`${fixed}\n`)) return text.slice(fixed.length + 1);
  }
  return text;
}

/** 사용자 설명 문단: 서식에 글자가 있으면 그 문단, 없으면 일반 텍스트를 줄마다 문단으로. 맨 앞 고정 문구 문단은 뺀다. */
function userBlocks(content: Record<string, unknown>): RichBlock[] {
  const rich = readTextBlocks(content.descriptionBlocks) ?? [];
  const withoutFixed = isFixedBlock(rich[0]) ? rich.slice(1) : rich;
  if (richBlocksOrNull(withoutFixed)) return withoutFixed;
  const plain = stripFixedPlain(String(content.description ?? ''));
  return plain.trim() ? plainTextToBlocks(plain) : [];
}

/**
 * POL-05-01 : 재생 경로
 * ■ 미리보기·저장 값에 고정 문구 붙이기
 * - in : popup(AdminPopupDetail) 편집 값(사용자 설명만 있음)
 * - out: 동영상·동영상+퀴즈면 descriptionBlocks 맨 앞에 고정 문구 문단(오른쪽 정렬·서식 없음), description = '고정 문구\n사용자 설명'.
 *        그 밖 유형은 그대로. 이미 붙어 있으면 다시 붙이지 않는다(여러 번 호출해도 같음). 받은 객체는 바꾸지 않는다.
 * - 서버는 descriptionBlocks에서 description을 다시 파생하므로 두 값이 어긋나지 않는다.
 */
export function applyVideoFixedDescription<T extends Pick<AdminPopupDetail, 'popupType' | 'content'>>(popup: T): T {
  if (!hasVideoFixedDescription(popup)) return popup;
  const user = userBlocks(popup.content);
  const blocks: RichBlock[] = [{ alignment: 'RIGHT', runs: [{ text: VIDEO_FIXED_DESCRIPTION, size: 12, color: '#9CA3AF' }] }, ...user];
  const userPlain = user.map(blockText).join('\n');
  return { ...popup, content: { ...popup.content, descriptionBlocks: blocks,
    description: userPlain.trim() ? `${VIDEO_FIXED_DESCRIPTION}\n${userPlain}` : VIDEO_FIXED_DESCRIPTION } };
}

/**
 * POL-05-01 : 재생 경로
 * ■ 불러온 값에서 고정 문구 떼기
 * - in : popup 서버에서 불러온 팝업(고정 문구가 저장돼 있을 수 있음)
 * - out: 동영상·동영상+퀴즈면 descriptionBlocks 맨 앞 고정 문구 문단과 description 앞 고정 문구를 뺀 값(에디터 표시용). 그 밖 유형은 그대로.
 */
export function stripVideoFixedDescription<T extends Pick<AdminPopupDetail, 'popupType' | 'content'>>(popup: T): T {
  if (!hasVideoFixedDescription(popup)) return popup;
  const rich = readTextBlocks(popup.content.descriptionBlocks);
  const blocks = rich && isFixedBlock(rich[0]) ? rich.slice(1) : rich;
  return { ...popup, content: { ...popup.content,
    descriptionBlocks: blocks && richBlocksOrNull(blocks) ? blocks : undefined,
    description: stripFixedPlain(String(popup.content.description ?? '')) } };
}
