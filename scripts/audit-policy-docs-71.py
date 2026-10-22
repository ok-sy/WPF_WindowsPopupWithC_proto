#!/usr/bin/env python3
"""TODO71 정적 관리 검증. 런타임/API 동작 테스트나 외부 링크 검증이 아니다."""
from pathlib import Path
import csv
import difflib
import json
import re
import subprocess
import sys
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'docs/reviews/TODO71'
POLICIES = ROOT / 'docs/policies'
SOURCE_PATHS = (
    'popup-frameWork/Popup/Views/Contents/PopupRichText.cs',
    'popup-frameWork/Popup/Services/PopupResultQueue.cs',
    'zero-rule-web/main/src/features/PopupcommonComponent/popupRichText.ts',
    'zero-rule-web/main/src/features/PopupcommonComponent/popupRichTextFormat.ts',
    'zero-rule-web/main/src/features/PopupcommonComponent/popupEditorTransform.ts',
    'zero-rule-server/domain/src/main/java/server/domain/popup/wpf/WpfNextPopupResponse.java',
    'zero-rule-server/domain/src/main/java/server/domain/popup/wpf/WpfResultResponse.java',
)


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8-sig')


def local_links(text):
    # Ignore fenced examples; fragments and external links are outside this check.
    fenced = False
    for number, line in enumerate(text.splitlines(), 1):
        if line.lstrip().startswith(('```', '~~~')):
            fenced = not fenced
            continue
        if fenced:
            continue
        for match in re.finditer(r'(?<!!)\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)', line):
            target = unquote(match[1].strip('<>').split('#', 1)[0])
            if target and not re.match(r'^[a-zA-Z][\w+.-]*:', target):
                yield number, target


def broken_links(path, content):
    return [(str(path.relative_to(ROOT)), n, target) for n, target in local_links(content)
            if not (path.parent / target).exists()]


def is_comment_line(line):
    return not line.strip() or line.lstrip().startswith(('//', '/*', '*'))


def main():
    checks = []
    def require(condition, message):
        if not condition:
            raise AssertionError(message)
        checks.append(message)

    inventory = json.loads((AUDIT / 'inventory.json').read_text())
    baseline = inventory['baseline']
    require(bool(re.fullmatch(r'[0-9a-f]{40}', baseline)), '고정 조사 커밋 SHA')
    records = inventory['records']
    require(sorted(r['number'] for r in records) == list(range(1, 71)), '01~70 중복·누락 없음')
    require(sum(r['present'] for r in records) == 64, '현존 원본 64개')
    require({r['number'] for r in records if not r['present']} == {8, 16, 21, 40, 41, 42}, '부재 6개 이력 분리')
    definitions = set()
    for number in range(1, 17):
        path = POLICIES / f'POL-{number:02}.md'
        text = path.read_text()
        ids = re.findall(r'^\| (POL-\d{2}-\d{2}) \|', text, re.M)
        require(ids == [f'POL-{number:02}-{i:02}' for i in range(1, 4)], f'POL-{number:02} 항목 ID 유일·연속')
        definitions.update(ids)
        for section in ('구현·계약 근거', '원본 TODO와 대체 관계', '검증 상태·미확정 범위'):
            require(section in text, f'POL-{number:02} {section}')
    require(len(definitions) == 48, '정책 세부 ID 48개 유일')
    for row in records:
        require((POLICIES / f'{row["primary"]}.md').exists(), f'TODO{row["number"]:02} 주 정책 역추적')
        for policy in row['related']:
            require((POLICIES / f'{policy}.md').exists(), f'TODO{row["number"]:02} 연관 {policy}')
        if row['present']:
            # Originals 01~70 are untouched, including historical status/checklist text.
            require((ROOT / row['path']).read_text(encoding='utf-8-sig') == git('show', f'{baseline}:{row["path"]}'), f'TODO{row["number"]:02} 원본 불변')
        else:
            require(not (ROOT / row['path']).exists() and bool(row['last_git_change']), f'TODO{row["number"]:02} 삭제 경로·Git 날짜')
        for path in row['sources'] + row['contracts']:
            require((ROOT / path).exists(), f'TODO{row["number"]:02} 근거 {path}')
    for name in SOURCE_PATHS:
        before = git('show', f'{baseline}:{name}').splitlines(keepends=True)
        after = (ROOT / name).read_text(encoding='utf-8-sig').splitlines(keepends=True)
        changed = [line for op, a, b, c, d in difflib.SequenceMatcher(a=before, b=after).get_opcodes()
                   if op != 'equal' for line in before[a:b] + after[c:d]]
        require(bool(changed) and all(is_comment_line(line) for line in changed), f'주석 외 줄 불변: {name}')
        for policy in re.findall(r'POL-\d{2}-\d{2}', ''.join(after)):
            require(policy in definitions, f'주석 정책 ID 존재: {name}: {policy}')
    requirements = list(csv.DictReader((AUDIT / 'requirements.csv').open()))
    comments = list(csv.DictReader((AUDIT / 'comments.csv').open()))
    require(bool(requirements) and all(1 <= int(r['todo']) <= 70 for r in requirements), '요건/이력 색인 번호 범위')
    require(bool(comments) and all(r['classification'] in ('유지', '정책 ID 연결', '삭제', '이력 문서 이동') for r in comments), '주석 분류·이유 기록')
    new_docs = list(POLICIES.glob('*.md')) + list(AUDIT.glob('*.md'))
    todo71 = next((ROOT / 'docs/design').glob('71_*.md'))
    new_broken = [x for path in new_docs + [todo71] for x in broken_links(path, path.read_text())]
    require(not new_broken, f'신규 문서/정책/TODO71 파일 링크: {new_broken}')
    readme = ROOT / 'docs/README.md'
    old_readme = git('show', f'{baseline}:docs/README.md')
    old_bad = set(broken_links(readme, old_readme))
    new_bad = set(broken_links(readme, readme.read_text()))
    # Compare target, not line number: inserted navigation shifts historical line numbers.
    require({(p, t) for p, n, t in new_bad} <= {(p, t) for p, n, t in old_bad}, 'docs README 신규 깨진 링크 없음')
    historical = []
    for name in git('ls-tree', '-r', '--name-only', baseline, 'docs').splitlines():
        if name.endswith('.md') and name != todo71.relative_to(ROOT).as_posix():
            historical.extend(broken_links(ROOT / name, git('show', f'{baseline}:{name}')))
    output = [
        '# TODO71 파일 링크 검증', '',
        f'조사 기준: `{baseline}`. 실행: `python3 scripts/audit-policy-docs-71.py`.', '',
        f'- 신규 정책/보고서/TODO71 파일 링크 오류: {len(new_broken)}개.',
        '- docs/README 추가 내비게이션에서 신규 오류 없음.',
        f'- 기존 docs Markdown에서 발견한 파일 링크 오류: {len(historical)}개. 아래는 조사 커밋 원문 기준이며 이번 수정으로 발생한 오류가 아니다.',
        '- 파일/디렉터리 존재만 검사. 앵커·외부 URL 가용성·코드 블록·Word/PDF/Excel 내부는 제외.', '',
        '| 기존 파일 | 줄 | 원문 대상 | 처리 |', '|---|---|---|---|',
    ]
    output += [f'| `{p}` | {n} | `{t}` | 과거 경로/링크 원문 보존; 별도 정정 대상 |' for p, n, t in historical]
    output += ['', '원본 이동은 수행하지 않았다. 기존 실패를 새 정책 링크 통과 결과에 합산해 숨기지 않는다.', '']
    (AUDIT / 'LINKS.md').write_text('\n'.join(output))
    print(json.dumps(dict(checks=len(checks), numbers=len(records), policies=16, policy_items=len(definitions),
                          requirement_rows=len(requirements), comment_rows=len(comments),
                          new_broken_links=len(new_broken), preexisting_broken_links=len(historical),
                          runtime_tests='not run'), ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (AssertionError, OSError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
