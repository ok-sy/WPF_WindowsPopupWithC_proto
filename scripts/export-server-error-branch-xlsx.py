#!/usr/bin/env python3
"""WPF API 장애별 분기 처리 정의서(Excel) 생성 — docs/interfaces/Server/SERVER_ERROR_BRANCH_v<버전>.xlsx

기준 문서는 docs/interfaces/Server/SERVER_WPF_ERROR_BRANCH_GUIDE.md다. 표·안내 문장·JSON 예시를 그대로 읽어 시트로 옮기므로
내용을 바꿀 때는 Markdown을 고친 뒤 이 스크립트를 다시 실행한다. 서식(제목·섹션·표·예시 블록)은
WPF 정의서 생성 스크립트(export-wpf-spec-xlsx.py)의 SheetWriter를 그대로 쓴다.

버전 관리
- 파일명은 SERVER_ERROR_BRANCH_v<버전>.xlsx. 버전은 Markdown '버전 이력' 표의 마지막 행이다.
- 생성하면 같은 폴더의 이전 SERVER_ERROR_BRANCH_v*.xlsx는 지운다(이전 버전은 Git 이력과 '버전 이력' 시트로 확인).

사용: python scripts/export-server-error-branch-xlsx.py
"""
import importlib.util
import os
import re
import sys

from openpyxl import Workbook

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUIDE = os.path.join(ROOT, 'docs', 'interfaces', 'Server', 'SERVER_WPF_ERROR_BRANCH_GUIDE.md')
OUT_DIR = os.path.join(ROOT, 'docs', 'interfaces', 'Server')

# WPF 정의서 스크립트의 서식·표 파서를 재사용한다(파일명에 '-'가 있어 경로로 불러온다).
sys.dont_write_bytecode = True   # 불러온 스크립트의 __pycache__를 scripts/에 남기지 않는다.
_spec = importlib.util.spec_from_file_location('wpf_spec', os.path.join(ROOT, 'scripts', 'export-wpf-spec-xlsx.py'))
wpf = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wpf)
SheetWriter, tables, code_block = wpf.SheetWriter, wpf.tables, wpf.code_block

LINES = open(GUIDE, encoding='utf-8').read().splitlines()
WIDTHS = [16, 16, 18, 18, 18, 18, 30, 34]   # 8칸 격자. 표는 열 수에 맞춰 칸을 병합한다.
SPANS = {
    2: [(1, 2), (3, 8)],
    3: [(1, 2), (3, 4), (5, 8)],
    4: [(1, 2), (3, 4), (5, 6), (7, 8)],
    5: [(1, 1), (2, 3), (4, 5), (6, 7), (8, 8)],
    6: [(1, 1), (2, 2), (3, 4), (5, 5), (6, 7), (8, 8)],
}


def section(number):
    """'## <번호>.' 절의 본문 줄(다음 '## ' 제목 전까지)."""
    rx = re.compile(rf'^##\s+{number}\.\s')
    for i, line in enumerate(LINES):
        if rx.match(line):
            body = []
            for line2 in LINES[i + 1:]:
                if line2.startswith('## '):
                    break
                body.append(line2)
            return LINES[i][3:].strip(), body
    raise KeyError(number)


def plain(text):
    """Markdown 표시(굵게·코드·링크)를 지운 셀 문자열."""
    s = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text or '')
    return s.replace('**', '').replace('`', '').strip()


def bullets(body):
    """표·코드 밖의 '- ' 안내 문장."""
    out, fenced = [], False
    for line in body:
        if line.strip().startswith('```'):
            fenced = not fenced
        elif not fenced and line.startswith('- '):
            out.append(plain(line[2:]))
    return out


def paragraphs(body):
    """표·목록·코드·제목이 아닌 문단."""
    out, fenced = [], False
    for line in body:
        if line.strip().startswith('```'):
            fenced = not fenced
            continue
        if fenced or not line.strip() or line.startswith(('|', '- ', '#')):
            continue
        out.append(plain(line))
    return out


def put_table(w, rows, mono=(), center=()):
    header = list(rows[0].keys())
    w.table(header, [[plain(r[h]) for h in header] for r in rows], mono_cols=mono, center_cols=center,
            spans=SPANS[len(header)])


def put_section(w, number, heading=None, mono=(), center=()):
    """절의 문단·표·'- ' 안내를 원문 순서대로 옮기고, 절 끝의 '### ' JSON 블록(본문 전체·샘플)을 이어서 넣는다."""
    title, body = section(number)
    w.section(heading or title)
    cut = next((i for i, line in enumerate(body) if line.startswith('### ')), len(body))
    put_body(w, body[:cut], mono, center)
    if cut < len(body):
        put_examples(w, body[cut:])


def put_body(w, lines, mono=(), center=()):
    block, kind, fenced = [], None, False

    def flush():
        nonlocal block, kind
        if kind == 'table':
            for t in tables(block):
                put_table(w, t, mono, center)
        elif kind == 'notes':
            w.notes([plain(line[2:]) for line in block])
        elif kind == 'para':
            w.notes([plain(line) for line in block])
        block, kind = [], None

    for line in lines:
        if line.strip().startswith('```'):
            fenced = not fenced
            continue
        if fenced or line.startswith('#'):
            continue
        k = 'table' if line.startswith('|') else 'notes' if line.startswith('- ') else 'para' if line.strip() else None
        if k != kind:
            flush()
            kind = k
        if k:
            block.append(line)
    flush()


def examples(body):
    """'### 라벨' 다음의 '상황:' 줄·'HTTP nnn' 줄과 json 코드 블록 목록."""
    out, label, status, situation, cur = [], None, None, None, None
    for line in body:
        if line.startswith('### '):
            label, status, situation = line[4:].strip(), None, None
        elif cur is None and out and out[-1][0] == label and line.strip() and not line.startswith(('상황: ', 'HTTP ', 'POST ', '기본 응답', '본문을 줄 경우', '```')):
            out[-1][4].append(plain(line))
        elif line.startswith('상황: ') and cur is None:
            situation = plain(line[4:])
        elif line.startswith(('HTTP ', 'POST ', '기본 응답', '본문을 줄 경우')) and cur is None:
            status = line.strip()
        elif line.strip().startswith(('```json', '```http')):
            cur = []
        elif line.strip() == '```' and cur is not None:
            out.append([label, status, situation, cur, []])
            cur = None
        elif cur is not None:
            cur.append(line)
    return out


def put_examples(w, body):
    """'### 라벨' 예시마다 코드 블록(JSON·HTTP 상태 줄)과 상황·안내 문장. 한 예시에 블록이 여럿이면 둘째부터 소제목만 표시."""
    after_label = None
    for label, status, situation, lines, after in examples(body):
        title = label if not status or status in label else f'{label} — {status}'
        if after_label == label:
            title = f'  └ {status}' if status else label
        after_label = label
        w.code(title, lines, col_to=6)
        w.row -= 1
        w.notes(([f'상황: {situation}'] if situation and title == label or situation and not title.startswith('  └') else []) + after)


def build(version, date):
    wb = Workbook()
    sub = f'{version} · {date} · 기준 문서 docs/interfaces/Server/SERVER_WPF_ERROR_BRANCH_GUIDE.md'

    ws = wb.active
    ws.title = '개요'
    w = SheetWriter(ws, WIDTHS)
    w.title(f'WPF API 장애별 분기 처리 정의서 ({version})', sub)
    put_section(w, 1, '① 백엔드 주요 개발 범위와 원칙 — 결과 API HTTP 200 분기가 핵심, HTTP 오류는 401·400만 필수')
    put_section(w, 2, '② 판정 순서 (요청 1건)', center=(0,))
    w.section('③ 시트 구성')
    put_table(w, [
        {'시트': 'HTTP_ERROR', '내용': '반드시 지켜야 하는 HTTP 오류 2가지(401·400), 선택 426, SAMPLE(기본은 상태 코드만, 본문은 선택)'},
        {'시트': 'RESULT_STATUS', '내용': '주요 개발 범위 — 결과 응답 본문 전체·status·code 정의, 장애 결과 요청(resultCode=400)'},
        {'시트': '결과 예시', '내용': '경우별 응답 본문 전체(JSON, 필수·선택 주석)'},
        {'시트': '적용 확인', '내용': '폐쇄망 백엔드 적용 시 확인 항목과 하지 말 것'},
        {'시트': '버전 이력', '내용': '정의서 버전별 변경 내용'},
    ])

    ws = wb.create_sheet('HTTP_ERROR')
    w = SheetWriter(ws, WIDTHS)
    w.title('필수 HTTP 오류 — 401 · 400(결과 API 본문 해석 불가), 426은 선택', sub)
    title, body = section(3)
    cut = next(i for i, line in enumerate(body) if line.startswith('### 샘플'))
    w.section('필수 HTTP 오류 정의')
    put_body(w, body[:cut], center=(0,))
    w.section('SAMPLE')
    put_examples(w, body[cut + 1:])

    ws = wb.create_sheet('RESULT_STATUS')
    w = SheetWriter(ws, WIDTHS)
    w.title('결과 응답(HTTP 200) — POST /p/api/wpf/popups/results', sub)
    put_section(w, 4, 'status 정의', mono=(0, 2))
    put_section(w, 5, 'code 값', mono=(0, 1))
    put_section(w, 6, '장애 결과 요청 (resultCode=400)')

    ws = wb.create_sheet('결과 예시')
    w = SheetWriter(ws, WIDTHS)
    w.title('응답 예시 — 본문 전체(필수·선택 주석)', sub)
    title, body = section(7)
    w.notes([p for p in paragraphs(body) if not p.startswith(('상황:', 'HTTP '))])
    put_examples(w, body)

    ws = wb.create_sheet('적용 확인')
    w = SheetWriter(ws, WIDTHS)
    w.title('폐쇄망 백엔드 적용 시 확인', sub)
    put_section(w, 8, '확인 항목')
    put_section(w, 9, '하지 말 것')

    ws = wb.create_sheet('버전 이력')
    w = SheetWriter(ws, [12, 14, 110])
    w.title('WPF API 장애별 분기 처리 정의서 - 버전 이력', sub)
    rows = tables(section(10)[1])[0]
    w.table(['버전', '날짜', '변경 내용'], [[plain(r['버전']), plain(r['날짜']), plain(r['변경 내용'])] for r in reversed(rows)],
            center_cols=(0, 1))

    for sheet in wb.worksheets:
        sheet.freeze_panes = 'A4'
        sheet.sheet_properties.pageSetUpPr.fitToPage = True
        sheet.page_setup.orientation = 'landscape'
        sheet.page_setup.fitToWidth = 1
        sheet.page_setup.fitToHeight = 0
    return wb


def main():
    last = tables(section(10)[1])[0][-1]
    version, date = plain(last['버전']), plain(last['날짜'])
    wb = build(version, date)
    out = os.path.join(OUT_DIR, f'SERVER_ERROR_BRANCH_{version}.xlsx')
    for f in os.listdir(OUT_DIR):
        if re.fullmatch(r'SERVER_ERROR_BRANCH_v[\d.]+\.xlsx', f) and f != os.path.basename(out):
            os.remove(os.path.join(OUT_DIR, f))
    wb.save(out)
    print('generated', os.path.relpath(out, ROOT))
    for ws in wb.worksheets:
        print(f'  {ws.title}: {ws.max_row} rows')


if __name__ == '__main__':
    sys.exit(main())
