#!/usr/bin/env python3
"""WPF 팝업 인터페이스 정의서(Excel) 생성 — docs/interfaces/WPF/WPF_SPEC_v<버전>.xlsx

기준 데이터는 인터페이스 계약서 docs/interfaces/WPF/POPUP_INTERFACE_SPEC.md의 필드 표다.
표에 없는 항목(설문 콘텐츠 필드, answers[] 하위 필드)과 시트별 동작 설명은 이 파일의 SUPPLEMENTS·NOTES에 둔다.

작성 규칙
- JSON 위치는 생략 없이 전체 경로로 적고, 필드 표는 JSON 위치 오름차순으로 나열한다.
- TODO·설계 번호 같은 작업 라벨은 적지 않는다(계약서 문구에서도 제거한다).
- 삭제·폐기된 필드는 행으로 남기거나 설명에 기재하지 않는다.

버전 관리
- 파일명은 WPF_SPEC_v<버전>.xlsx. 새 버전은 VERSIONS 끝에 (버전, 날짜, 변경 내용)을 추가하고 다시 생성한다.
- 생성하면 같은 폴더의 이전 WPF_SPEC_v*.xlsx는 지운다(이전 버전은 Git 이력과 '버전 이력' 시트로 확인).

사용: python scripts/export-wpf-spec-xlsx.py
"""
import math
import os
import re
import sys
import unicodedata

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = os.path.join(ROOT, 'docs', 'interfaces', 'WPF', 'POPUP_INTERFACE_SPEC.md')
OUT_DIR = os.path.join(ROOT, 'docs', 'interfaces', 'WPF')

VERSIONS = [
    ('v3.7', '2026-10-22', [
        '계약 v3.7 기준 Excel 정의서(이전 파일명 WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx).',
    ]),
    ('v3.8', '2026-11-11', [
        '파일명을 WPF_SPEC_v<버전>.xlsx로 바꾸고 버전 이력 시트를 추가.',
        '결과 요청에 장애 결과 필드 resultCode·resultDesc 추가(조회 응답을 처리하지 못했을 때 400과 오류 설명 전송).',
        '결과 전송 처리 기준 확정: HTTP 400은 종결·삭제, INTERNAL_ERROR·잘못된 2xx 응답은 3회 재전송 후 삭제.',
        '장애 복구 주기: 10초 간격 3회 × 3사이클(사이클 사이 30분), 이후 1시간마다 1회. 1회 재인증 후에도 401이면 같은 복구.',
        '정의서 정리: JSON 위치 전체 경로·오름차순, 작업 라벨 제거, 삭제·폐기 항목 제외, 계약서 기준으로 기본값 정정(동영상+퀴즈 completionRatio 0.8).',
    ]),
]

# ---------------------------------------------------------------- 계약서 파싱
LINES = open(SPEC, encoding='utf-8').read().splitlines()


def section(heading_re):
    """제목이 heading_re에 맞는 절의 본문 줄(다음 같은·상위 수준 제목 전까지)."""
    rx = re.compile(heading_re)
    for i, line in enumerate(LINES):
        m = re.match(r'^(#+)\s+(.*)$', line)
        if m and rx.search(m.group(2)):
            level = len(m.group(1))
            body = []
            for line2 in LINES[i + 1:]:
                m2 = re.match(r'^(#+)\s', line2)
                if m2 and len(m2.group(1)) <= level:
                    break
                body.append(line2)
            return body
    raise KeyError(heading_re)


def split_row(line):
    cells, buf, code = [], '', False
    for ch in line.strip().strip('|'):
        if ch == '`':
            code = not code
        if ch == '|' and not code and (not buf.endswith('\\')):
            cells.append(buf.strip())
            buf = ''
        else:
            buf += ch
    cells.append(buf.strip())
    return [c.replace('\\|', '|') for c in cells]


def tables(body, stop_at_heading=False):
    """본문에서 Markdown 표 목록(각 표 = 행 dict 목록)."""
    out, cur, header = [], None, None
    for line in body:
        if stop_at_heading and line.startswith('#'):
            break
        if line.startswith('|'):
            cells = split_row(line)
            if header is None:
                header, cur = cells, []
            elif all(re.fullmatch(r':?-{2,}:?', c) for c in cells):
                continue
            else:
                cur.append(dict(zip(header, cells)))
        elif header is not None:
            out.append(cur)
            header, cur = None, None
    if header is not None:
        out.append(cur)
    return out


def code_block(body, must_contain=None, lang='json'):
    blocks, cur = [], None
    for line in body:
        if cur is None and line.strip().startswith('```' + lang):
            cur = []
        elif cur is not None and line.strip() == '```':
            blocks.append(cur)
            cur = None
        elif cur is not None:
            cur.append(line)
    for b in blocks:
        if must_contain is None or any(must_contain in l for l in b):
            return b
    raise KeyError(must_contain)


# ---------------------------------------------------------------- 문구 정리
LABEL_PAREN = re.compile(r'\s*\((?:[^()]*?(?:TODO\s?\d|설계\s?\d|PU001|v3\.\d|20\d\d-\d\d-\d\d)[^()]*?)\)')
LABEL_BRACKET = re.compile(r'\s*\[(?:TODO|설계)[^\]]*\]\s*')
LABEL_BARE = re.compile(r'(?:TODO\s?\d+(?:[-·]\d+)*|설계\s?\d+(?:[-·]\d+)*|PU001(?:\s?[A-Z]-\d+|\s?§\s?\d+)?)')


def clean(text):
    s = text or ''
    s = re.sub(r'~~[^~]*~~', '', s)
    s = s.replace('**', '').replace('`', '')
    s = LABEL_PAREN.sub('', s)
    s = LABEL_BRACKET.sub(' ', s)
    s = LABEL_BARE.sub('', s)
    s = re.sub(r'\s*\((?:§\s?[\d.]+[^()]*|\d\.\d(?:\s?참고)?|초안|아래 표)\)', '', s)
    s = re.sub(r'§\s?\d+(?:\.\d+)*\s?', '', s)
    s = re.sub(r'\(\s*[,·—-]?\s*\)', '', s)
    s = re.sub(r'\s+([,.)·])', r'\1', s)
    s = re.sub(r'([(])\s+', r'\1', s)
    s = re.sub(r'\s{2,}', ' ', s)
    return s.strip().strip('—').strip()


DELETED = re.compile(r'폐기|삭제됨|^삭제|제거됨')


def is_deleted(row):
    field = row.get('필드', '')
    req = row.get('필수 여부', '')
    return '~~' in field or bool(DELETED.search(req))


def field_rows(table, prefix, rename=None):
    """계약서 필드 표 → (JSON 위치, 형식, 필수, 기본값, 설명)."""
    rows = []
    for r in table:
        if is_deleted(r):
            continue
        name = clean(r.get('필드', ''))
        fmt = clean(r.get('형식', ''))
        req = clean(r.get('필수 여부', r.get('필수', '')))
        desc = ''
        for key in ('C# 처리', '설명', '처리', '단위/의미', 'Default/생성 기준'):
            if r.get(key):
                desc = clean(r[key])
                break
        if 'Default' in r or '기본값' in r:
            default = clean(r.get('Default', r.get('기본값', '')))
        elif 'Default/생성 기준' in r:
            default = 'null' if desc.startswith('null') else '-'
        else:
            default = '-'
        if r.get('허용 값'):
            desc = f"허용 값: {clean(r['허용 값'])}. {desc}".strip()
        desc = OVERRIDES.get(prefix + name, desc)
        names = [n.strip() for n in name.split('/')] if ' / ' in name else [name]
        base = ''
        for n in names:
            if '.' in n or '[' in n:
                base = n.rsplit('.', 1)[0] + '.' if '.' in n else ''
            full = n if ('.' in n or n.endswith('[]')) else base + n
            if rename:
                full = rename(full)
            path = prefix + full
            if fmt.startswith('array') and not path.endswith('[]'):
                path += '[]'
            rows.append([path, fmt, req, default, desc])
    return rows


OVERRIDES = {
    'popup.content': '유형별 화면 데이터. 필드는 TEXT·IMAGE·VIDEO·SURVEY_QUIZ 시트 참고. 공통 화면 옵션은 popup 최상위에 둔다',
    'popup.popupPosition': 'CENTER / TOP_LEFT / TOP_CENTER / TOP_RIGHT / CENTER_LEFT / CENTER_RIGHT / BOTTOM_LEFT / BOTTOM_CENTER / BOTTOM_RIGHT. 없거나 잘못되면 CENTER',
}


def dedupe_sort(rows):
    best = {}
    for r in rows:
        key = r[0]
        if key not in best or len(r[4]) > len(best[key][4]):
            best[key] = r
    return sorted(best.values(), key=lambda r: r[0].lower())


# ---------------------------------------------------------------- 시트 데이터
def popup_common():
    t = tables(section(r'^6\.3 popup 공통 필드'))[0]
    return field_rows(t, 'popup.')


def root_rows():
    t = tables(section(r'^6\.2 Response Envelope'))[0]
    return field_rows(t, '')


def text_rows():
    body = section(r'^8\.1 TEXT')
    main = tables(body, stop_at_heading=True)[0]
    blocks = tables(section(r'^textBlocks \(서식 본문'))[0]

    def runs(path):
        return path.replace('runs[]', 'textBlocks[].runs[]', 1) if path.startswith('runs[]') else path
    return dedupe_sort(field_rows(main, 'popup.content.') + field_rows(blocks, 'popup.content.', runs))


def image_rows():
    main = tables(section(r'^8\.2 IMAGE'), stop_at_heading=True)[0]
    common = {r[0]: r for r in popup_common()}
    return dedupe_sort(field_rows(main, 'popup.content.') + [common['popup.width'], common['popup.height']])


def video_rows():
    main = tables(section(r'^8\.3 VIDEO'), stop_at_heading=True)[0]
    common = {r[0]: r for r in popup_common()}
    return dedupe_sort(field_rows(main, 'popup.content.') + [common['popup.completionRatio']])


def survey_quiz_rows():
    q_body = section(r'^9\. questions\[\] 계약')
    q_table = tables(q_body, stop_at_heading=True)[0]
    o_table = tables(section(r'^options\[\]$'))[0]
    common = {r[0]: r for r in popup_common()}
    rows = field_rows(q_table, 'popup.questions[].') + field_rows(o_table, 'popup.questions[].options[].')
    rows += [common[k] for k in ('popup.questions[]', 'popup.passingScore', 'popup.requiresPassing', 'popup.completionRatio')
             if k in common]
    rows += SUPPLEMENTS['survey_quiz']
    return dedupe_sort(rows)


def request_rows():
    t = tables(section(r'^결과 필드$'))[0]
    v = tables(section(r'^10\.7 VIDEO_WATCHED'))[0]
    return dedupe_sort(field_rows(t, '') + field_rows(v, 'video.') + SUPPLEMENTS['request'])


def response_rows():
    t = tables(section(r'^응답 필드$'))[0]
    return dedupe_sort(field_rows(t, ''))


SUPPLEMENTS = {
    'survey_quiz': [
        ['popup.content.surveyTitle', 'string', '선택', '""', '설문·퀴즈 콘텐츠 제목. 서식이 있으면 서버가 surveyTitleBlocks에서 만든 문자열(200자 이하)'],
        ['popup.content.surveyTitleBlocks[]', 'array', '선택', '생략', '콘텐츠 제목 서식(TEXT textBlocks와 같은 문단·구간 구조)'],
        ['popup.content.description', 'string', '선택', '""', '설문·퀴즈 콘텐츠 설명(2000자 이하)'],
        ['popup.content.descriptionBlocks[]', 'array', '선택', '생략', '콘텐츠 설명 서식'],
        ['popup.content.videoEnabled', 'boolean', 'QUIZ 선택', 'false', 'true면 동영상+퀴즈. 영상 필드(videoUrl·videoTitle·showControls·allowFullScreen·allowPlaybackRateChange·allowSeek·autoPlay·isLoop·defaultVolume)는 VIDEO 시트와 같다. SURVEY에는 쓰지 않는다'],
    ],
    'request': [
        ['answers[].questionId', 'integer', 'Y', '없음', '응답한 문항 ID'],
        ['answers[].optionIds[]', 'array', '선택형 문항', '[]', '선택한 optionId 목록. TEXT 문항은 []. null 요소 금지'],
        ['answers[].textAnswer', 'string', 'TEXT 문항', 'null', '주관식 입력값. UTF-8 1,000 Byte 이하(넘으면 400). 선택형은 null 또는 생략'],
    ],
}

NOTES = {
    'root': [
        '조회는 POST /api/wpf/popups 한 번에 팝업 1건을 받는다. 표시할 팝업이 없으면 popup 키를 유지하고 null.',
        'popup.deliveryId는 서버가 조회마다 발급하는 전달 건 ID다. WPF는 바꾸지 않고 결과 요청에 그대로 넣는다. 응답을 받지 못해 다시 조회하면 같은 값이 온다.',
        'pollingIntervalSeconds는 1800~3600초. WPF는 가장 최근 값을 쓰고, 0 이하면 WPF 로컬 설정을 유지한다.',
        '공통 화면 옵션(Overlay·위치·글꼴·Footer)은 content가 아니라 popup 최상위에 둔다. content에는 유형별 화면 데이터만 둔다.',
        'popupPosition ENUM: CENTER / TOP_LEFT / TOP_CENTER / TOP_RIGHT / CENTER_LEFT / CENTER_RIGHT / BOTTOM_LEFT / BOTTOM_CENTER / BOTTOM_RIGHT.',
    ],
    'TEXT': [
        'textBlocks가 있으면 서식 본문을 표시하고, 없으면 plainText를 표시한다.',
        '콘텐츠 제목·설명은 textBlocks 앞 문단으로 작성하며 plainText 첫 줄에도 포함된다.',
        '서식 허용 범위는 서버 저장 API가 검증하고, WPF는 표시만 방어한다: 범위 밖 크기·잘못된 들여쓰기는 0, 변환할 수 없는 색·글꼴·정렬은 기본값, 구조 오류는 plainText 표시.',
        'indent는 0 이상 정수(1단계 = 40, 웹 CSS px·WPF DIP)이며 0이면 키를 생략한다. 줄바꿈된 모든 줄에 같은 여백을 준다.',
    ],
    'IMAGE': [
        '크기는 popup 최상위 width/height 한 쌍으로 받는다. ADAPTIVE·ORIGINAL은 팝업 창 전체, FIT_TO_IMAGE는 이미지 콘텐츠 영역 크기다.',
        'ADAPTIVE: 헤더·푸터·제목·설명·여백을 뺀 영역에 이미지 비율을 유지해 표시.',
        'FIT_TO_IMAGE: 이미지 콘텐츠 영역에 부가 영역을 더해 창 크기를 계산. keepAspectRatio=true는 영역 안 비율 유지(여백 가능), false는 영역을 채움.',
        'ORIGINAL: 왼쪽 위 기준 원본 크기로 표시하고 넘치는 부분은 잘라낸다.',
        '최종 창은 가로·세로 300 이상, 현재 모니터 작업 영역의 90% 이하.',
    ],
    'VIDEO': [
        '로컬·공유 폴더 경로와 직접 재생 HTTP/HTTPS 영상을 WebView2로 재생한다(WebView2를 쓸 수 없을 때만 MediaElement). 두 경우 모두 같은 WPF 컨트롤바를 쓴다.',
        '시청 완료는 min(watchedSeconds, durationSeconds) / durationSeconds를 소수점 4자리에서 내린 비율이 completionRatio 이상일 때다. 탐색으로 건너뛴 구간은 시청 시간에 더하지 않는다.',
        'completionRatio는 popup 최상위 값이다. 시청 기준 전에는 하단 버튼이 비활성이고, 완료 전 이탈은 나중에 보기(showLater), 외부 닫기는 useBackgroundOverlay로 정한다.',
        'allowSeek=false면 진행바·키보드 이동만 막고 진행률·시간 표시는 유지한다.',
    ],
    'SURVEY_QUIZ': [
        'SURVEY는 채점하지 않는다. QUIZ 선택형은 선택한 optionId 집합과 isCorrect=true 집합이 정확히 같을 때 정답이며 부분 점수는 없다.',
        'QUIZ MULTIPLE_CHOICE는 isCorrect=true 선택지 수까지만 고를 수 있다. SURVEY MULTIPLE_CHOICE는 minSelections·maxSelections로 범위를 정한다.',
        'TEXT 문항 QUIZ는 correctAnswer와 answerMatchMode(EXACT / CONTAINS)로 채점한다. questionScore가 없으면 1점.',
        'WPF가 score·passed를 최종 판정한다. requiresPassing=true(커트라인형·만점형)는 통과해야 제출되고, false(참여형)는 미달이어도 passed=false로 제출·완료된다.',
        '동영상+퀴즈는 popupType=QUIZ에 content.videoEnabled=true. 영상 시청 비율이 completionRatio(생략 시 0.8) 이상이 되면 문항 입력과 제출이 열린다.',
        '서식 필드(이름이 Blocks로 끝나는 필드)가 있으면 서버가 같은 이름의 일반 문자열을 만들어 함께 보낸다. 서식이 없거나 구조 오류면 일반 문자열을 표시한다. 주관식 답변·correctAnswer는 서식 대상이 아니다.',
    ],
    'request': [
        '결과는 객체 1건(배열 아님)을 POST /api/wpf/popups/results로 보낸다. 결과는 메모리 큐에 넣고 순서대로 1건씩 보낸다.',
        '재전송할 때 resultId·deliveryId·본문을 바꾸지 않는다. 서버는 같은 resultId를 DUPLICATE로 처리한다.',
        'resultType: CLOSED 일반 종료 / HIDDEN 다시 보지 않기(hideDays) / LATER 나중에 보기(완료·숨김 없이 다음 조회 주기에 다시 표시) / SUBMITTED 설문·퀴즈 제출 / VIDEO_WATCHED 영상 시청 종료.',
        '다시 보지 않기를 고르면 영상 시청 기록이 있어도 HIDDEN이다. 나중에 보기 버튼으로 닫으면 체크 여부와 관계없이 LATER이며 video를 보내지 않는다.',
        'TEXT·IMAGE의 CLOSED는 완료로 저장된다. 설문·퀴즈·영상이 미완료로 끝나면 pollingIntervalSeconds 동안 다시 표시하지 않는다.',
        '장애 결과: 받은 조회 응답을 처리하지 못하면(빈 본문·JSON 오류·표시 변환 실패) resultId·resultCode=400·resultDesc를 보낸다. deliveryId·popupId는 확보한 경우에만 넣고 resultType은 보내지 않는다.',
        '장애 결과의 deliveryId가 있으면 서버가 그 전달 건만 오류로 종료한다(완료·숨김 아님, 다음 조회 주기까지 유예). deliveryId 없이 저장됐거나 저장되지 못하면 WPF는 조회 간격을 기다린다.',
    ],
    'response': [
        'WPF는 HTTP 성공만으로 저장 성공을 판단하지 않고 status를 본다. ACCEPTED·DUPLICATE·REJECTED만 종결로 보고 큐에서 지운다.',
        'nextStatus: AVAILABLE이면 바로 다음 조회, EMPTY면 가장 최근 pollingIntervalSeconds를 기다린다. 생략되면(후보 확인 실패) 바로 조회한다.',
        '미종결 결과가 남아 있으면 다음 팝업을 조회하지 않고 결과를 먼저 다시 보낸다.',
        '장애 복구 주기: 10초 간격 3회 × 3사이클(사이클 사이 30분), 이후 1시간마다 1회. 성공하면 처음부터 다시 센다. 결과 저장에 성공하면 결과 단계 횟수를 초기화하고, 이어진 조회 실패는 1회부터 센다.',
    ],
}

TYPE_SUMMARY = [
    ['TEXT', '일반 안내', 'content.plainText / content.textBlocks[]', '닫으면 완료'],
    ['IMAGE', '이미지 안내', 'content.imageUrl / content.imageSizeMode, popup.width·height', '닫으면 완료'],
    ['VIDEO', '동영상 시청', 'content.videoUrl, popup.completionRatio', '시청 기준을 채우면 완료'],
    ['SURVEY', '설문', 'popup.questions[]', '제출하면 완료(채점 없음)'],
    ['QUIZ', '퀴즈', 'popup.questions[], popup.passingScore, popup.requiresPassing', 'WPF가 채점, 제출하면 완료'],
    ['QUIZ + content.videoEnabled', '동영상+퀴즈', 'QUIZ 필드 + 영상 필드, popup.completionRatio(기본 0.8)', '시청 기준 후 문항 입력·제출'],
]

FLOW = [
    ['1', '로그인', 'WPF-00 POST /api/wpf/auth/login. 토큰을 받아 이후 요청의 Authorization에 넣는다. 401이면 1회 재로그인 후 같은 요청을 다시 보낸다.'],
    ['2', '조회', 'WPF-01 POST /api/wpf/popups. 표시할 팝업 1건(popup, deliveryId 포함) 또는 popup=null.'],
    ['3', '표시·사용자 처리', '팝업 1건을 표시한다. 표시 중에는 다른 조회를 하지 않는다.'],
    ['4', '결과 전송', 'WPF-02 POST /api/wpf/popups/results. 결과 1건(deliveryId 포함)을 보낸다.'],
    ['5', '다음 조회', 'nextStatus AVAILABLE·생략이면 바로 조회, EMPTY 또는 popup=null이면 pollingIntervalSeconds 뒤 조회.'],
    ['6', '장애 복구', '미전송 결과를 먼저 다시 보낸다. 복구 주기 10초×3회×3사이클(사이 30분) 후 1시간마다. 426이면 업데이트 안내 후 종료.'],
]

ERROR_HANDLING = [
    ['저장 완료 / 같은 resultId 처리 완료', '200', 'ACCEPTED / DUPLICATE', '-', '삭제하고 nextStatus를 따른다'],
    ['업무 검증 오류(필수 누락, 알 수 없는 resultType, 범위 밖 값 등)', '200', 'REJECTED', 'WPF_INVALID_RESULT 등', '사유를 기록하고 삭제. 다음 결과 전송·조회는 계속'],
    ['검증 통과 후 원인 미확정 오류', '200', 'INTERNAL_ERROR', 'WPF_INTERNAL', '보관 후 같은 resultId 재전송. 3회에 이르면 삭제하고 조회 허용'],
    ['확인된 일시 장애(DB 연결·데드락·잠금 대기·타임아웃)', '200', 'RETRYABLE_ERROR', 'WPF_RETRYABLE', '보관 후 복구 주기로 같은 resultId 재전송'],
    ['요청 JSON 문법·역직렬화 오류', '400', '-', 'WPF_BAD_REQUEST', '다시 보내도 같으므로 종결·삭제. 다음 결과 전송·조회는 계속'],
    ['응답 내용이 잘못됨(빈 본문·JSON 오류·resultId 불일치·status 누락·모르는 값)', '200', '-', '-', '같은 resultId 3회까지 재전송, 3회에 이르면 삭제하고 조회 허용'],
    ['인증 실패(1회 재인증 후에도 401)', '401', '-', 'WPF_UNAUTHORIZED', '보관하고 조회를 미룬 뒤 복구 주기로 재전송'],
    ['클라이언트 버전 미지원', '426', '-', 'CLIENT_VERSION_NOT_SUPPORTED', '전송을 멈추고 업데이트 안내 후 종료'],
    ['그 밖의 실패(5xx·응답 없음·타임아웃·연결 끊김)', '그 밖의 4xx·5xx / 응답 없음', '-', '-', '보관하고 조회를 미룬 뒤 복구 주기로 재전송'],
]

STATUS_HANDLING = {
    'ACCEPTED': '종결. 큐에서 지우고 nextStatus를 따른다',
    'DUPLICATE': '종결. 큐에서 지우고 nextStatus를 따른다',
    'REJECTED': '종결. 사유를 기록하고 지운다',
    'RETRYABLE_ERROR': '보관 후 복구 주기로 재전송',
    'INTERNAL_ERROR': '보관 후 재전송, 3회에 이르면 삭제',
}

# ---------------------------------------------------------------- 서식
# 색상·글꼴은 이전 정의서(WPF_POPUP_INTERFACE_LATEST_MAIN.xlsx)를 따른다: 진회색 제목 띠, 연회색 구역·표 머리, 눈금선 표시.
FONT = '맑은 고딕'
TITLE_FILL = PatternFill('solid', fgColor='2F343B')
SECTION_FILL = PatternFill('solid', fgColor='E9ECEF')
HEAD_FILL = PatternFill('solid', fgColor='D9DEE3')
BOX_FILL = PatternFill('solid', fgColor='F7F8FA')
NOTE_FILL = PatternFill('solid', fgColor='F7F7F7')
LINE = Side(style='thin', color='C8CDD3')
BORDER = Border(left=LINE, right=LINE, top=LINE, bottom=LINE)
ROW_H = 22          # 한 줄 행 높이(이전 정의서 기준)
LINE_H = 15         # 줄바꿈 한 줄당 높이


def disp_width(s):
    return sum(2 if unicodedata.east_asian_width(c) in 'WF' else 1 for c in s)


def lines_for(text, width):
    width = max(width * 0.95 - 1, 1)
    return sum(max(1, math.ceil(disp_width(part) / width)) for part in str(text).split('\n'))


def fit_height(lines):
    return max(ROW_H, LINE_H * lines + 7)


class SheetWriter:
    def __init__(self, ws, widths):
        self.ws, self.widths, self.row = ws, widths, 1
        self.ncol = len(widths)
        for i, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(i)].width = w

    def merged(self, col_from, col_to, value, font, fill=None, align=None, border=False):
        for col in range(col_from, col_to + 1):
            cell = self.ws.cell(self.row, col)
            if fill:
                cell.fill = fill
            if border:
                cell.border = BORDER
        if col_to > col_from:
            self.ws.merge_cells(start_row=self.row, start_column=col_from, end_row=self.row, end_column=col_to)
        c = self.ws.cell(self.row, col_from, value)
        c.font = font
        c.alignment = align or Alignment(vertical='center', wrap_text=True)
        return c

    def title(self, text, sub):
        for r in (1, 2):
            for col in range(1, self.ncol + 1):
                self.ws.cell(r, col).fill = TITLE_FILL
            self.ws.row_dimensions[r].height = ROW_H
        self.ws.merge_cells(start_row=1, start_column=1, end_row=2, end_column=self.ncol)
        c = self.ws.cell(1, 1, text)
        c.font = Font(name=FONT, size=15, bold=True, color='FFFFFF')
        c.alignment = Alignment(horizontal='left', vertical='center', indent=1)
        self.row = 3
        self.merged(1, self.ncol, sub, Font(name=FONT, size=9, color='595959'),
                    align=Alignment(horizontal='right', vertical='center'))
        self.ws.row_dimensions[3].height = ROW_H
        self.row = 4

    def section(self, text):
        self.merged(1, self.ncol, text, Font(name=FONT, size=11, bold=True, color='222222'), SECTION_FILL,
                    Alignment(horizontal='left', vertical='center', indent=1))
        self.ws.row_dimensions[self.row].height = ROW_H
        self.row += 1

    def table(self, header, rows, mono_cols=(), spans=None, center_cols=()):
        """표. spans는 논리 열마다 (시작 열, 끝 열)이며 끝 열이 크면 병합한다. 기본은 열 하나씩."""
        spans = spans or [(i, i) for i in range(1, len(header) + 1)]
        widths = [sum(self.widths[a - 1:b]) for a, b in spans]
        for (a, b), v in zip(spans, header):
            self.merged(a, b, v, Font(name=FONT, size=10, bold=True, color='222222'), HEAD_FILL,
                        Alignment(horizontal='center', vertical='center', wrap_text=True), border=True)
        self.ws.row_dimensions[self.row].height = ROW_H
        self.row += 1
        for r in rows:
            lines = 1
            for idx, ((a, b), v, width) in enumerate(zip(spans, r, widths)):
                mono = idx in mono_cols
                self.merged(a, b, v, Font(name='Consolas' if mono else FONT, size=10, color='222222'),
                            align=Alignment(horizontal='center' if idx in center_cols else 'left',
                                            vertical='center', wrap_text=True), border=True)
                lines = max(lines, lines_for(v, width * (0.92 if mono else 1)))
            self.ws.row_dimensions[self.row].height = fit_height(lines)
            self.row += 1
        self.row += 1

    def notes(self, items):
        """동작 설명: 항목마다 한 행(전체 열 병합), 연회색 바탕."""
        span = sum(self.widths)
        for text in items:
            self.merged(1, self.ncol, f'• {text}', Font(name=FONT, size=10, color='222222'), NOTE_FILL,
                        Alignment(vertical='center', wrap_text=True, indent=1))
            self.ws.row_dimensions[self.row].height = fit_height(lines_for(text, span - 6))
            self.row += 1
        self.row += 1

    def code(self, label, lines, col_to=None):
        self.section(label)
        col_to = col_to or self.ncol
        for line in lines:
            self.merged(1, col_to, line, Font(name='Consolas', size=9, color='333333'), NOTE_FILL,
                        Alignment(vertical='center', wrap_text=False, indent=1))
            self.ws.row_dimensions[self.row].height = 14
            self.row += 1
        self.row += 1

    def flow(self, top, bottom, last):
        """처리 흐름 상자: 윗줄 왼→오, 오른쪽 끝에서 ↓, 아랫줄 오→왼, 왼쪽 끝에서 ↓, 마지막 줄 왼→오."""
        box_font = Font(name=FONT, size=10, bold=True, color='333333')
        arrow_font = Font(name=FONT, size=12, bold=True, color='7A828C')
        center = Alignment(horizontal='center', vertical='center', wrap_text=True)

        def line(items, arrow):
            for i, text in enumerate(items):
                col = 1 + i * 2
                self.merged(col, col, text, box_font, BOX_FILL, center, border=True)
                if i < len(items) - 1:
                    self.merged(col + 1, col + 1, arrow, arrow_font, align=center)
            self.ws.row_dimensions[self.row].height = 30
            self.row += 1

        def down(col):
            self.merged(col, col, '↓', arrow_font, align=Alignment(horizontal='center', vertical='center'))
            self.ws.row_dimensions[self.row].height = 18
            self.row += 1

        line(top, '→')
        down(1 + (len(top) - 1) * 2)
        line(list(reversed(bottom)), '←')
        down(1)
        line(last, '→')
        self.row += 1


SENTENCE_END = re.compile(r'(?<=[^\d.])\.\s')


def field_table(w, rows, scope):
    """필드 표: 필드(시트 범위 기준 상대 이름, 범위가 없으면 마지막 이름) | JSON 위치(전체 경로) | 형식 | 필수 | Default | 설명 | 비고.
    설명은 계약서 문구의 첫 문장, 나머지 문장은 비고로 나눈다."""
    out = []
    for path, fmt, req, default, desc in rows:
        if scope and path.startswith(scope) and len(path) > len(scope):
            name = path[len(scope):]
        else:
            name = path.rsplit('.', 1)[-1]
        parts = SENTENCE_END.split(desc, maxsplit=1)
        head = parts[0].strip().rstrip('.')
        rest = parts[1].strip() if len(parts) > 1 else ''
        out.append([name, path, fmt, req, default, head, rest])
    w.table(FIELD_HEADER, out, mono_cols=(0, 1), center_cols=(2, 3, 4))


FIELD_HEADER = ['필드', 'JSON 위치', '형식', '필수', 'Default', '설명', '비고']
FIELD_WIDTHS = [32, 42, 11, 16, 13, 40, 48]


def build(version, date):
    wb = Workbook()
    sub = f'{version} · {date} · 기준 문서 docs/interfaces/WPF/POPUP_INTERFACE_SPEC.md'

    # 개요
    ws = wb.active
    ws.title = '개요'
    w = SheetWriter(ws, [22, 18, 28, 18, 22, 18, 36, 18])
    w.title(f'WPF 팝업 인터페이스 개요 ({version})', sub)
    w.section('① 전체 처리 프로세스')
    w.row += 1
    w.flow(['관리자 화면', '관리자 API', 'Oracle', 'WPF 조회 API(1건)'],
           ['PopupFactory / View', 'PopupManager', 'PopupWindow', '사용자 동작'],
           ['WPF 결과 수신 API(1건)', 'Oracle', 'nextStatus → 다음 조회'])
    w.notes(['상세 흐름: 관리자 화면 → 관리자 API → Oracle → WPF 조회 API(1건, deliveryId) → PopupResponseDto → PopupFactory → '
             'PopupOptions + 유형별 View → PopupManager → PopupWindow → 사용자 동작 → 결과 큐 → WPF 결과 수신 API(1건) → Oracle → '
             'nextStatus(AVAILABLE: 바로 다음 조회 / EMPTY: 조회 간격 대기)'])
    w.section('② 처리 단계')
    w.table(['단계', '구분', '내용'], FLOW, spans=[(1, 1), (2, 2), (3, 8)], center_cols=(0,))
    w.section('③ 팝업 유형 요약')
    w.table(['popupType', '설명', '핵심 데이터', '완료 기준'], TYPE_SUMMARY, mono_cols=(0, 2),
            spans=[(1, 1), (2, 2), (3, 5), (6, 8)])
    w.section('④ WPF API')
    api = tables(section(r'^3\. 현재 C#이 사용하는 API'))[0]
    w.table(['ID', '기능', 'Method', '경로', '비고'],
            [[clean(r['ID']), clean(r['기능']), clean(r['Method']), clean(r['기본 경로']),
              '로그인 경로는 설정 Auth.LoginPath로 바꿀 수 있다' if r['ID'] == 'WPF-00' else ''] for r in api],
            mono_cols=(3,), spans=[(1, 1), (2, 2), (3, 3), (4, 5), (6, 8)], center_cols=(0, 2))
    w.section('⑤ 시트 구성')
    w.table(['시트', '내용'], [
        ['공통', '조회 응답 ROOT와 popup 공통 필드, 조회 동작'],
        ['TEXT / IMAGE / VIDEO / SURVEY_QUIZ', '유형별 content·문항 필드와 동작'],
        ['Sample', '유형별 조회 응답 popup JSON 예시'],
        ['RESULT_REQUEST / RESULT_RESPONSE', '결과 API 요청·응답 필드, status·오류 처리 기준'],
        ['버전 이력', '정의서 버전별 변경 내용'],
    ], spans=[(1, 2), (3, 8)])
    w.notes(['JSON 위치는 생략 없이 전체 경로로 적고, 필드 표는 JSON 위치 오름차순으로 나열한다. 삭제·폐기된 항목은 적지 않는다.'])

    # 공통
    ws = wb.create_sheet('공통')
    w = SheetWriter(ws, FIELD_WIDTHS)
    w.title('WPF 팝업 - 공통 계약 (조회 응답 POST /api/wpf/popups)', sub)
    w.section('조회 응답 ROOT · popup 공통 필드')
    field_table(w, dedupe_sort(root_rows() + popup_common()), 'popup.')
    w.section('동작')
    w.notes(NOTES['root'])

    for name, rows, scope in (('TEXT', text_rows(), 'popup.content.'), ('IMAGE', image_rows(), 'popup.content.'),
                              ('VIDEO', video_rows(), 'popup.content.'), ('SURVEY_QUIZ', survey_quiz_rows(), 'popup.')):
        ws = wb.create_sheet(name)
        w = SheetWriter(ws, FIELD_WIDTHS)
        w.title(f'WPF 팝업 - {name.replace("_", " / ")}', sub)
        w.section(f'{name.replace("_", " / ")} 필드')
        field_table(w, rows, scope)
        w.section('동작')
        w.notes(NOTES[name])

    # Sample
    ws = wb.create_sheet('Sample')
    w = SheetWriter(ws, [30, 30, 30, 30, 30, 40])
    w.title('WPF 팝업 - JSON 예시 (조회 응답 popup)', sub)
    for heading, label in ((r'^15\.1 TEXT', 'TEXT'), (r'^15\.2 IMAGE', 'IMAGE'), (r'^15\.3 VIDEO', 'VIDEO'),
                           (r'^15\.4 SURVEY', 'SURVEY'), (r'^15\.5 QUIZ', 'QUIZ'), (r'^15\.6 VIDEO\+QUIZ', 'VIDEO+QUIZ')):
        w.code(label, code_block(section(heading)))

    # RESULT_REQUEST
    ws = wb.create_sheet('RESULT_REQUEST')
    w = SheetWriter(ws, FIELD_WIDTHS)
    w.title('WPF 결과 API 요청 - POST /api/wpf/popups/results (결과 1건)', sub)
    w.section('결과 요청 필드')
    field_table(w, request_rows(), '')
    w.section('동작')
    w.notes(NOTES['request'])
    w.code('예시 - 동영상+퀴즈 제출', code_block(section(r'^10\.6 SUBMITTED'), '"resultType"'), col_to=3)
    w.code('예시 - 장애 결과', code_block(section(r'^10\.10 장애 결과'), '"resultCode"'), col_to=3)

    # RESULT_RESPONSE
    ws = wb.create_sheet('RESULT_RESPONSE')
    w = SheetWriter(ws, FIELD_WIDTHS)
    w.title('WPF 결과 API 응답 - POST /api/wpf/popups/results (결과 1건)', sub)
    w.section('결과 응답 필드')
    field_table(w, response_rows(), '')
    w.section('status 처리 기준')
    st = tables(section(r'^status 의미$'))[0]
    w.table(['status', '의미', 'WPF 처리'],
            [[clean(r['status']), clean(r['의미']), STATUS_HANDLING.get(clean(r['status']), '')] for r in st],
            mono_cols=(0,), spans=[(1, 1), (2, 5), (6, 7)])
    w.section('code 값')
    ct = tables(section(r'^code 값$'))[0]
    keys = list(ct[0].keys())
    w.table(['status', 'code', '의미'],
            [[clean(r[keys[0]]), clean(r[keys[1]]), clean(r[keys[2]]) if len(keys) > 2 else ''] for r in ct],
            mono_cols=(0, 1), spans=[(1, 1), (2, 2), (3, 7)])
    w.section('오류 처리 기준 (HTTP / status)')
    w.table(['상황', 'HTTP', 'status', 'code', 'WPF 처리'], ERROR_HANDLING,
            spans=[(1, 2), (3, 3), (4, 5), (6, 6), (7, 7)], center_cols=(1,))
    w.section('동작')
    w.notes(NOTES['response'])
    w.code('응답 예시', code_block(LINES, '"nextStatus": "AVAILABLE"'), col_to=3)

    # 버전 이력
    ws = wb.create_sheet('버전 이력')
    w = SheetWriter(ws, [12, 14, 110])
    w.title('WPF 팝업 인터페이스 정의서 - 버전 이력', sub)
    w.table(['버전', '날짜', '변경 내용'], [[v, d, '\n'.join(f'• {x}' for x in items)] for v, d, items in reversed(VERSIONS)],
            center_cols=(0, 1))

    for sheet in wb.worksheets:
        sheet.freeze_panes = 'A4' if sheet.title in ('개요', 'Sample', '버전 이력') else 'A6'
        sheet.sheet_properties.pageSetUpPr.fitToPage = True
        sheet.page_setup.orientation = 'landscape'
        sheet.page_setup.fitToWidth = 1
        sheet.page_setup.fitToHeight = 0
    return wb


def main():
    version, date, _ = VERSIONS[-1]
    wb = build(version, date)
    out = os.path.join(OUT_DIR, f'WPF_SPEC_{version}.xlsx')
    for f in os.listdir(OUT_DIR):
        if re.fullmatch(r'WPF_SPEC_v[\d.]+\.xlsx', f) and f != os.path.basename(out):
            os.remove(os.path.join(OUT_DIR, f))
    wb.save(out)
    print('generated', os.path.relpath(out, ROOT))
    for ws in wb.worksheets:
        print(f'  {ws.title}: {ws.max_row} rows')


if __name__ == '__main__':
    sys.exit(main())
