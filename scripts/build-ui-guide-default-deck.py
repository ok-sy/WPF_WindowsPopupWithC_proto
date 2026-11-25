# POL-16-02 : 재현 가능한 검증
# ■ 공통 팝업 UI 가이드 PPT — 화면 정책 기본값 판 만들기(2026-11-25)
# - in : argv[1] 만들 PPT 경로(예시판 「공통 팝업 UI 가이드 · WEB과 WPF.pptx」를 먼저 복사해 둔 파일),
#        .offline-verify/popup-parity/deck-default/(PARITY_DECK=default node scripts/verify-popup-parity.cjs 결과: 캡처·deck.json)
# - out: 1~8장 캡처를 기본 창(POPUP_DEFAULTS, 현재 적용 정책) 캡처로 바꾸고 치수선·숫자·참고 글을 실측 위치로 다시 그림, 모든 장에 기준 표시.
#   스크롤로 가려진 요소(주관식·두 번째 문항 등)는 치수선 대신 참고 글로 알린다. 9~11장(버튼·완료 팝업)은 창 크기와 무관해 그대로.
#   사용자용 가이드라 슬라이드 글자에 개발 용어(폐쇄망·ADAPTIVE·POPUP_DEFAULTS·공통코드·WEB/WPF·DIP·수식)를 쓰지 않고 노트는 비운다(예시판은 개발자 기준 파일이라 그대로).
# - 실행(저장소 루트):
#   PARITY_DECK=default node scripts/verify-popup-parity.cjs
#   cp "docs/design/61_popup_layout_guide/공통 팝업 UI 가이드 · WEB과 WPF.pptx" "docs/design/61_popup_layout_guide/공통 팝업 UI 가이드 · WEB과 WPF (화면 기본값).pptx"
#   python scripts/build-ui-guide-default-deck.py "docs/design/61_popup_layout_guide/공통 팝업 UI 가이드 · WEB과 WPF (화면 기본값).pptx"
# - 필요: python-pptx. 기본 창 크기 글자(560 × 420)는 기준 표시·참고 글에 적혀 있으니 기본값이 바뀌면 함께 고친다.
import sys, json
from pptx import Presentation
from pptx.util import Emu, Pt, Inches
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

# 화면 정책 기본값 판: 고정한 예시판(720×900)을 복사한 파일의 1~8장 캡처·치수·참고 글을 기본 창(POPUP_DEFAULTS) 캡처로 다시 만든다.
F, D = sys.argv[1], '.offline-verify/popup-parity/deck-default/'
deck = json.load(open(D + 'deck.json', encoding='utf-8'))
p = Presentation(F); IN = 914400; PPI = 110; k = IN / PPI
RED = RGBColor(0xDC, 0x26, 0x26); NOTE = RGBColor(0x37, 0x41, 0x51); TAG = RGBColor(0x6B, 0x72, 0x80)
AREA_L, AREA_R, TOP = 0.46, 7.20, 1.30


def arrow(s, x1, y1, x2, y2):
    c = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Emu(int(x1)), Emu(int(y1)), Emu(int(x2)), Emu(int(y2)))
    c.line.color.rgb = RED; c.line.width = Pt(1.25); c.name = '치수선'
    ln = c.line._get_or_add_ln()
    for tag in ('a:headEnd', 'a:tailEnd'):
        e = etree.SubElement(ln, qn(tag)); e.set('type', 'triangle'); e.set('w', 'sm'); e.set('len', 'sm')


def text(s, t, x, y, w, h, size, color, bold, align, name):
    tb = s.shapes.add_textbox(Emu(int(x)), Emu(int(y)), Emu(int(w)), Emu(int(h))); tb.name = name
    tf = tb.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.word_wrap = False; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    para = tf.paragraphs[0]; para.alignment = align
    r = para.add_run(); r.text = t; r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color


def label(s, t, cx, cy, side):
    w = Inches(0.1 + 0.105 * len(t)); h = Inches(0.24); gap = Inches(0.05)
    x = {'right': cx + gap, 'left': cx - gap - w, 'above': cx - w / 2, 'below': cx - w / 2}[side]
    y = {'right': cy - h / 2, 'left': cy - h / 2, 'above': cy - gap - h, 'below': cy + gap * 0.4}[side]
    align = {'right': PP_ALIGN.LEFT, 'left': PP_ALIGN.RIGHT}.get(side, PP_ALIGN.CENTER)
    text(s, t, x, y, w, h, 11, RED, True, align, '치수 ' + t)


def base(name):
    d = deck[name]; W, H = d['plate']['w'], d['plate']['h']; V = H - 64   # V: 푸터 위 = 보이는 본문 아래 끝
    b = d['buttons'][-1]['box'] if d['buttons'] else None
    btn = []
    if b:
        btn = [('h', b['y'] - 8, b['x'], b['x'] + b['w'], str(b['w']), 'above'),
               ('v', b['x'] + b['w'] + 12, b['y'], b['y'] + b['h'], str(b['h']), 'right')]
    vis = lambda box: bool(box) and box['y'] + box['h'] <= V
    return d, W, H, V, W + 14, btn, vis


out = {}
d, W, H, V, R, btn, vis = base('PARITY-TEXT-560x750')
bx = d['buttons'][-1]['box']
out[1] = ('PARITY-TEXT-560x750',
          [('v', R, 0, 40, '헤더 40', 'right'), ('v', W / 2, 40, 64, '24', 'right'), ('h', H / 2, 0, 28, '28', 'below'),
           ('h', H / 2, W - 28, W, '28', 'below'), ('v', W / 2, V - 24, V, '24', 'right'), ('v', R, V, H, '푸터 64', 'right'),
           ('v', bx['x'] + bx['w'] / 2, H - 15, H, '15', 'left')],
          ['기본 창 560 × 420(관리자 화면에서 새 팝업을 만들 때 들어가는 크기)', '창 최소 300 × 300 · 최대 1200 × 900',
           '지금 적용 중인 기본값 — 관리자 설정에서 바꿀 수 있음', '헤더 제목 시작 18 · 본문·푸터 좌우 28'])
out[2] = ('PARITY-TEXT-560x750',
          [('h', -36, -24, W + 24, '창 %d' % (W + 48), 'above'), ('v', -36, -24, H + 24, str(H + 48), 'left')] + btn,
          ['기본 창 %d × %d → 흰 판 %d × %d' % (W + 48, H + 48, W, H), '본문은 자체 최소·최대 없음 — 넘치면 세로 스크롤', '확인 버튼 최소 118 × 34'])
out[3] = ('PARITY-TEXT-NARROW-LONG',
          [('h', 308, 0, 28, '28', 'below'), ('v', 156, 40, 64, '24', 'right'), ('v', 326, 322, 432, '푸터 110', 'right')],
          ['좁은 창 예시 360 × 480(기본값 아님)', '제목은 1줄, 넘치면 말줄임', '버튼 배치: 미리보기는 줄바꿈 · 실제 팝업은 한 줄', '푸터 최소 높이 64(줄바꿈하면 늘어남, 이 예시 110)'])
d, W, H, V, R, btn, vis = base('PARITY-IMAGE'); im = d['image']
out[4] = ('PARITY-IMAGE',
          [('v', R, im['y'], im['y'] + im['h'], '이미지 칸 %d' % im['h'], 'right'), ('h', H + 14, im['x'], im['x'] + im['w'], str(im['w']), 'below'),
           ('h', im['y'] + im['h'] / 2, 0, 28, '28', 'below'), ('v', W / 2, 40, 64, '24', 'right')],
          ['기본 창에서 이미지 칸 %d × %d' % (im['w'], im['h']), '이미지는 원본보다 크게 늘리지 않음', '설명 영역(선택): 최대 30%'])
d, W, H, V, R, btn, vis = base('PARITY-VIDEO'); vd = d['video']
out[5] = ('PARITY-VIDEO',
          [('v', R, vd['y'], vd['y'] + vd['h'], '영상 %d' % vd['h'], 'right'), ('h', H + 14, vd['x'], vd['x'] + vd['w'], str(vd['w']), 'below')] + btn,
          ['기본 창에서 영상 높이 %d(미리보기 최소 170) — 설명까지 세로 스크롤' % vd['h'], '실제 팝업은 남은 높이를 채움', '확인 버튼 최소 118 × 34'])
d, W, H, V, R, btn, vis = base('PARITY-SURVEY'); q = d['questions']
dims6 = [('h', H + 14, q['x'], q['x'] + q['w'], '문항 영역 %d (최대 760)' % q['w'], 'below')]
if vis(d['options'][0]):
    o = d['options'][0]; dims6.append(('v', R, o['y'], o['y'] + o['h'], '선택지 32', 'right'))
if vis(d['textarea']):
    ta = d['textarea']; dims6.append(('v', R, ta['y'], ta['y'] + ta['h'], '주관식 96~180', 'right'))
# 기본 창에서는 스크롤 내용이 버튼 위까지 차 있어 버튼 치수 글자가 겹친다 → 버튼 크기는 9장·참고 글로.
out[6] = ('PARITY-SURVEY', dims6,
          ['기본 창에서는 문항이 넘쳐 세로 스크롤(스크롤바만큼 문항 너비 %d)' % q['w'], '주관식 96~180은 스크롤해야 보임', '선택지 최소 높이 32 · 제출 최소 132 × 34'])
d, W, H, V, R, btn, vis = base('PARITY-QUIZ-OX'); q = d['questions']
dims7 = [('h', H + 14, q['x'], q['x'] + q['w'], '문항 영역 %d (최대 760)' % q['w'], 'below')]
if vis(d['options'][0]):
    o = d['options'][0]; dims7.append(('v', R, o['y'], o['y'] + o['h'], 'O / X 32 · 2열', 'right'))
if vis(d['options'][2]):
    o = d['options'][2]; dims7.append(('v', R, o['y'], o['y'] + o['h'], '선택지 32 · 1열', 'right'))
out[7] = ('PARITY-QUIZ-OX', dims7, ['기본 창에서는 두 번째 문항부터 세로 스크롤', 'O / X 2열 · 단일 선택지 1열, 높이 32', '제출 최소 132 × 34'])
d, W, H, V, R, btn, vis = base('PARITY-VIDEO-QUIZ'); vd = d['video']; q = d['questions']
dims8 = [('v', R, vd['y'], vd['y'] + vd['h'], '영상 %d' % vd['h'], 'right'), ('h', H + 14, q['x'], q['x'] + q['w'], '문항 영역 %d (최대 760)' % q['w'], 'below')]
if vis(d['options'][0]):
    o = d['options'][0]; dims8.append(('v', R, o['y'], o['y'] + o['h'], '선택지 32', 'right'))
out[8] = ('PARITY-VIDEO-QUIZ', dims8,
          ['영상 높이는 너비와 영상 비율로 정해짐(이 창에서 %d), 최소 180' % vd['h'], '기본 창에서는 문항이 영상 아래로 넘쳐 세로 스크롤', '영상 최대: 남는 높이의 70%(최소 180)'])

for no, (name, dims, notes) in out.items():
    s = p.slides[no - 1]; d = deck[name]
    for sh in list(s.shapes):
        if sh.name.startswith('치수') or sh.name == '참고':
            sh._element.getparent().remove(sh._element)
    pic = [x for x in s.shapes if x.shape_type == 13][0]
    s.part.related_part(pic._element.blipFill.blip.rEmbed)._blob = open(D + name + '.png', 'rb').read()
    CW, CH = d['canvas']['w'], d['canvas']['h']; ox, oy = d['plateOffset']['x'], d['plateOffset']['y']
    nw, nh = int(CW * k), int(CH * k); nl = int((AREA_L + AREA_R) / 2 * IN - nw / 2); nt = int(TOP * IN)
    pic.left, pic.top, pic.width, pic.height = Emu(nl), Emu(nt), Emu(nw), Emu(nh)
    X = lambda px: nl + (ox + px) * k
    Y = lambda px: nt + (oy + px) * k
    for kind, a, b1, b2, t, side in dims:
        if kind == 'v':
            arrow(s, X(a), Y(b1), X(a), Y(b2)); label(s, t, X(a), (Y(b1) + Y(b2)) / 2, side)
        else:
            arrow(s, X(b1), Y(a), X(b2), Y(a)); label(s, t, (X(b1) + X(b2)) / 2, Y(a), side)
    tb = s.shapes.add_textbox(Inches(7.4), Inches(1.4), Inches(5.5), Inches(3.0)); tb.name = '참고'
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_left = tf.margin_right = 0
    for i, t in enumerate(notes):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph(); para.space_after = Pt(10)
        r = para.add_run(); r.text = t; r.font.size = Pt(14); r.font.color.rgb = NOTE
    print('slide', no, name, '%.2fx%.2f' % (nw / IN, nh / IN), 'dims', len(dims))
# 사용자용 가이드: 개발 용어(WEB/WPF·DIP·수식·글자 굵기 숫자)를 쉬운 말로, 슬라이드 노트(개발 문서 경로)는 비운다.
PLAIN = [('WEB CSS px / WPF DIP (96 DPI)', '단위: 픽셀(화면 배율 100% 기준) · 관리자 미리보기와 실제 팝업이 같은 크기'),
         ('WPF DIP (96 DPI)  ·  WEB 미리보기는 안내 문구로 표시', '단위: 픽셀(화면 배율 100% 기준)  ·  관리자 미리보기에서는 팝업 대신 안내 문구로 표시'),
         ('확인 팝업 · WPF', '확인 팝업'),
         ('영상 시청 전 확인 비활성은 WPF에만 적용', '영상 시청 전 확인 비활성은 실제 팝업에만 적용(미리보기는 항상 활성)'),
         ('14 / 600', '14 · 굵게')]
for s in p.slides:
    for sh in s.shapes:
        if not sh.has_text_frame:
            continue
        for para in sh.text_frame.paragraphs:
            full = ''.join(r.text for r in para.runs)
            new = full
            for a, b in PLAIN:
                new = new.replace(a, b)
            if new != full and para.runs:
                para.runs[0].text = new
                for r in para.runs[1:]:
                    r.text = ''
    if s.has_notes_slide:
        s.notes_slide.notes_text_frame.text = ''
# 9장 버튼 표: 관리자 화면에 버튼 글자·푸터 글자 크기 입력이 없어 버튼 크기는 고정값 하나다 → 최소 너비 대신 실제 크기로.
s9 = p.slides[8]
for sh in s9.shapes:
    if not sh.has_text_frame or not sh.text_frame.paragraphs[0].runs:
        continue
    t = sh.text_frame.text; r0 = sh.text_frame.paragraphs[0].runs[0]
    if t == '최소 너비 × 높이':
        r0.text = '너비 × 높이'
    elif t == '나중에 보기 · 보조 닫기':
        r0.text = '나중에 보기'
    elif t == '118 × 34' and abs(sh.top - Inches(2.85)) < Inches(0.05):
        r0.text = '121 × 34'   # 실측 120.9(글자 때문에 최소 118보다 넓음)
    elif t.startswith('영상 시청 전 확인 비활성'):
        r0.text = '버튼 크기는 창 크기와 상관없이 항상 같음  ·  버튼 글자 14 · 굵게  ·  설문 보조 닫기 118 × 34'
        para = sh.text_frame.add_paragraph(); r = para.add_run()
        r.text = '영상 시청 전 확인 비활성은 실제 팝업에만 적용(미리보기는 항상 활성)'
        r.font.size = r0.font.size; r.font.color.rgb = r0.font.color.rgb
        sh.top = Inches(5.86); sh.height = Inches(0.8)
for s in p.slides:
    text(s, '화면 기본값 기준 · 창 560 × 420', Inches(8.4), Inches(0.42), Inches(4.5), Inches(0.3), 13, TAG, True, PP_ALIGN.RIGHT, '기준 표시')
p.save(F); print('saved')
