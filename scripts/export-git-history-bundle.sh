#!/bin/bash
# 웹·WPF 조회 전용 Git 히스토리 번들 생성(폐쇄망 반입 9-git-history)
# - in : 저장소 커밋(기본 main), 직전 번들(.offline-cache/git-history-<날짜>/*.bundle, 자동 탐색)
# - out: .offline-cache/git-history-<날짜>/ — <날짜>-popup-web-wpf-history.bundle, COMMIT-MAP.txt, README-IMPORT.md, SHA256SUMS.txt
#
# 이유: 폐쇄망은 웹(2-zero-rule-web)·WPF(3-popup-frameWork)를 이 번들 clone에서 subtree split한 브랜치로 연결해 pull한다.
#       그래서 매번 같은 필터·치환 규칙으로 만들어 커밋 ID가 직전 번들과 이어져야 한다(1105→1106 연속 확인).
#       아래 규칙(범위·제외 경로·mailmap·치환·메시지 정리·git-filter-repo 버전)을 바꾸면 커밋 ID가 모두 바뀌어
#       폐쇄망에서 다시 clone·연결해야 한다. 바꿀 때는 그 영향을 감수하는 경우에만 바꾸고 RULES를 올린다.
#       RULES 2(2026-11-10): WPF 데모 미디어 폴더(Popup/Media — 영상 두 버전 약 18.9MB·이미지)를 이력에서 제외.
#         번들의 약 70%가 데모 영상이었다. 미디어 파일은 3-popup-frameWork.tar로 전달하고 popup-frameWork/.gitignore로 무시한다.
#         RULES 1 번들(20261105·20261106)과는 커밋 ID가 이어지지 않는다(폐쇄망은 RULES 2 첫 번들에서 split·연결 시작).
#
# 정리 규칙
#   범위    zero-rule-web, popup-frameWork (MockSso·Popup.slnx·Popup.BehaviorTests·Popup.RecoveryTests·Popup/Media 제외)
#   작성자  mailmap으로 ok-sy <ok-sy@offline.local> 통일
#   치환    개발 DB IP → <DEV-HOST>, 웹 암호화 키 → <REDACTED>, LoginForm 기본 비밀번호 → '' (값은 대상 커밋에서 읽고 출력하지 않음)
#   메시지  Co-Authored-By·생성 도구 표기 줄 제거
#   점검    결과 이력 전체에 IP·키·비밀번호·DB 비밀번호(shell/dev-db.local.env)·개인 메일·트레일러가 0건이어야 하고,
#           제외 경로가 이력에 없어야 하며, 대상 커밋의 트리와 같아야 한다. 직전 번들 HEAD가 새 이력의 조상이어야 한다.
#
# [사용] Git Bash에서 저장소 루트 기준
#   bash scripts/export-git-history-bundle.sh                       # 오늘 날짜, main, 같은 RULES의 직전 번들 자동 탐색
#   bash scripts/export-git-history-bundle.sh -d 20261112           # 날짜 지정
#   bash scripts/export-git-history-bundle.sh -p .offline-cache/git-history-20261106/20261106-popup-web-wpf-history.bundle
#   bash scripts/export-git-history-bundle.sh -p none               # 연속성 확인 생략(규칙을 바꿔 새로 시작할 때만)
#   bash scripts/export-git-history-bundle.sh -r 9403689 -o <폴더>   # 과거 커밋으로 재현 확인(출력 폴더 지정)
# 생성 후 export-offline-package.ps1 -GitHistoryDir .offline-cache/git-history-<날짜> 로 반입본에 넣는다.
set -euo pipefail

SRC=$(cd "$(dirname "$0")/.." && pwd)
DATE=$(TZ=Asia/Seoul date +%Y%m%d)
REF=main
PREV=auto
OUT=""
while getopts "d:r:p:o:" opt; do
  case $opt in
    d) DATE=$OPTARG ;;
    r) REF=$OPTARG ;;
    p) PREV=$OPTARG ;;
    o) OUT=$OPTARG ;;
    *) echo "옵션: -d 날짜 -r 커밋 -p 직전번들|none -o 출력폴더" >&2; exit 2 ;;
  esac
done
[ -n "$OUT" ] || OUT="$SRC/.offline-cache/git-history-$DATE"
B="$DATE-popup-web-wpf-history.bundle"
T="$SRC/.offline-cache/tools"
H="$SRC/.offline-verify/hist-$DATE"
FR="$T/git_filter_repo.py"
FR_VERSION=2.47.0
# 필터 규칙 버전: 규칙을 바꾸면 올린다. 출력 폴더 RULES.txt에 남기고, 직전 번들 자동 탐색은 같은 버전만 고른다.
RULES=2

# 직전 번들: 지정이 없으면 이번 날짜를 뺀 git-history-* 폴더 중 RULES.txt가 같은 가장 최근 번들
# (RULES.txt가 없는 20261105·20261106은 RULES 1이라 고르지 않는다)
if [ "$PREV" = auto ]; then
  PREV=""
  for d in $(ls -d "$SRC"/.offline-cache/git-history-*/ 2>/dev/null | grep -v "git-history-$DATE/" | sort); do
    [ "$(cat "$d/RULES.txt" 2>/dev/null | tr -d '\r\n')" = "$RULES" ] && PREV=$(ls "$d"*.bundle 2>/dev/null | head -1)
  done
  [ -n "$PREV" ] || PREV=none
fi
if [ "$PREV" != none ]; then
  [ -f "$PREV" ] || { echo "직전 번들 없음: $PREV" >&2; exit 1; }
  PREV_HEAD=$(git bundle list-heads "$PREV" | awk '$2=="refs/heads/main"{print $1}')
  [ -n "$PREV_HEAD" ] || { echo "직전 번들에 main 없음: $PREV" >&2; exit 1; }
  echo "직전 번들: $(basename "$PREV") (main ${PREV_HEAD:0:7})"
else
  echo "직전 번들: 확인 생략"
fi

# git-filter-repo: 버전이 달라지면 같은 입력이라도 결과가 달라질 수 있어 고정한다.
if [ ! -f "$FR" ]; then
  python -m pip install --quiet --disable-pip-version-check --target "$T" "git-filter-repo==$FR_VERSION"
fi
ls "$T" | grep -q "git_filter_repo-$FR_VERSION.dist-info" || { echo "git-filter-repo $FR_VERSION 아님: $T" >&2; exit 1; }

rm -rf "$H"; mkdir -p "$H"
cd "$H"
git clone -q --no-local --no-tags "$SRC" work
git -C work checkout -q -B main "$(git -C "$SRC" rev-parse "$REF^{commit}")"
git -C work remote remove origin
for b in $(git -C work for-each-ref --format='%(refname:short)' refs/heads | grep -vx main); do git -C work branch -q -D "$b"; done
BASE=$(git -C work rev-parse HEAD)

KEY=$(git -C work show HEAD:zero-rule-web/main/src/auth/authentication.ts | grep -E "const secret = '" | grep -oE "'[^']+'" | tr -d "'")
LF=$(git -C work show HEAD:zero-rule-web/main/src/components/LoginForm/LoginForm.tsx | grep -E "^[[:space:]]*passwd: '" | grep -oE "'[^']+'" | tr -d "'" || true)
[ -n "$KEY" ] || { echo "authentication.ts 암호화 키를 찾지 못함(코드 구조 변경 시 치환 규칙 재검토)" >&2; exit 1; }
[ -n "$LF" ] || { echo "LoginForm.tsx 기본 비밀번호를 찾지 못함(코드 구조 변경 시 치환 규칙 재검토)" >&2; exit 1; }
PW=""
[ -f "$SRC/shell/dev-db.local.env" ] && PW=$(grep '^ZERO_RULE_DB_PASSWORD=' "$SRC/shell/dev-db.local.env" | cut -d= -f2- | tr -d '\r' || true)
[ -n "$PW" ] || echo "경고: shell/dev-db.local.env의 DB 비밀번호가 없어 DB 비밀번호 점검을 생략한다"

cat > mailmap.txt <<'EOF'
ok-sy <ok-sy@offline.local> ok-sy <dkgus2252@nate.com>
ok-sy <ok-sy@offline.local> ok-sy <89506551+ok-sy@users.noreply.github.com>
ok-sy <ok-sy@offline.local> 옥승엽 <oso792@naver.com>
EOF
{
  printf '192.168.114.71==><DEV-HOST>\n'
  printf '%s==><REDACTED>\n' "$KEY"
  printf "passwd: '%s'==>passwd: ''\n" "$LF"
} > replace.txt
MSG='import re
message = re.sub(rb"(?im)^[ \t]*co-authored-by:.*(\r?\n|$)", b"", message)
message = re.sub(rb"(?im)^.*generated with \[?claude.*(\r?\n|$)", b"", message)
return message.rstrip() + b"\n"
'

cd work
python "$FR" --quiet --force --path zero-rule-web --path popup-frameWork >/dev/null 2>&1
python "$FR" --quiet --force --invert-paths --path popup-frameWork/MockSso --path popup-frameWork/Popup.slnx --path popup-frameWork/Popup.BehaviorTests --path popup-frameWork/Popup.RecoveryTests --path popup-frameWork/Popup/Media >/dev/null 2>&1
python "$FR" --quiet --force --mailmap ../mailmap.txt --replace-text ../replace.txt --message-callback "$MSG" >/dev/null 2>&1
NEW=$(git rev-parse HEAD); COUNT=$(git rev-list --count HEAD)
echo "기준 ${BASE:0:7} → 번들 main ${NEW:0:7} (커밋 $COUNT)"

# 민감값 점검: 하나라도 남으면 중단(값은 출력하지 않는다)
git log -p --no-color --no-ext-diff --format=%B 2>/dev/null > ../all.txt
fail=0
check() { if [ "$2" != 0 ]; then echo "점검 실패: $1 $2건" >&2; fail=1; else echo "점검 $1 0"; fi; }
check dev-ip "$(grep -c '192\.168\.114' ../all.txt || true)"
check key "$(grep -cF -- "$KEY" ../all.txt || true)"
check passwd "$(grep -cE "passwd: '[^']+'" ../all.txt || true)"
[ -z "$PW" ] || check db-pw "$(grep -cF -- "$PW" ../all.txt || true)"
check email "$(grep -cE 'dkgus2252|oso792|89506551' ../all.txt || true)"
check trailer "$(git log --format=%B | grep -ciE 'co-authored-by|generated with|anthropic' || true)"
check excluded-paths "$(git log --format= --name-only | grep -cE 'MockSso|Popup\.slnx|BehaviorTests|RecoveryTests|Popup/Media/|zero-rule-server|AGENTS|CHANGELOG' || true)"
check other-authors "$(git log --format='%an <%ae>|%cn <%ce>' | grep -cv '^ok-sy <ok-sy@offline.local>|ok-sy <ok-sy@offline.local>$' || true)"
rm -f ../all.txt

# 트리 비교: 치환한 2개 파일(+IP 치환 파일) 외에는 대상 커밋과 같아야 한다
git ls-tree -r HEAD | awk '{print $3"\t"$4}' | sort -k2 > ../new.tsv
git -C "$SRC" ls-tree -r "$BASE" -- zero-rule-web popup-frameWork | awk '{print $3"\t"$4}' \
  | grep -vE 'popup-frameWork/(MockSso|Popup\.slnx|Popup\.BehaviorTests|Popup\.RecoveryTests|Popup/Media/)' | sort -k2 > ../old.tsv
DIFF_PATHS=$(diff ../old.tsv ../new.tsv | grep -E '^[<>]' | cut -f2 | sort -u || true)
echo "치환으로 내용이 바뀐 파일: $(echo "$DIFF_PATHS" | grep -c . || true)"
echo "$DIFF_PATHS" | sed 's/^/  /'
OTHER=$(echo "$DIFF_PATHS" | grep -vE '^(zero-rule-web/main/src/auth/authentication\.ts|zero-rule-web/main/src/components/LoginForm/LoginForm\.tsx|zero-rule-web/Dockerfile|zero-rule-web/_build-docker-dev\.sh)$' | grep -c . || true)
check unexpected-tree-diff "$OTHER"

# 연속성: 직전 번들 HEAD가 새 이력에 있고 조상이어야 폐쇄망에서 pull로 이어진다
if [ "$PREV" != none ]; then
  if git cat-file -e "$PREV_HEAD^{commit}" 2>/dev/null && git merge-base --is-ancestor "$PREV_HEAD" HEAD; then
    echo "연속성 확인: 직전 main ${PREV_HEAD:0:7} → 새 main ${NEW:0:7} ($(git rev-list --count "$PREV_HEAD"..HEAD)개 추가)"
  else
    echo "연속성 실패: 직전 번들 main ${PREV_HEAD:0:7}이 새 이력에 없다(규칙·도구 버전 변경 여부 확인)" >&2; fail=1
  fi
fi
[ "$fail" = 0 ] || { echo "점검 실패로 번들을 만들지 않는다. 작업 폴더: $H" >&2; exit 1; }

rm -rf "$OUT"; mkdir -p "$OUT"
echo "$RULES" > "$OUT/RULES.txt"
python - "$H/work/.git/filter-repo/commit-map" "$OUT/COMMIT-MAP.txt" "$SRC" "$BASE" <<'PY'
import subprocess, sys
mp, out, src, base = sys.argv[1:]
rows = [l.split() for l in open(mp) if l.strip() and not l.startswith('old')]
m = {a: b for a, b in rows if set(b) != {'0'}}
order = subprocess.check_output(['git', '-C', src, 'rev-list', '--reverse', base], text=True).split()
hit = [c for c in order if c in m]
with open(out, 'w', newline='\n', encoding='utf-8') as f:
    f.write('# 원본 커밋 -> 번들 커밋 (웹·WPF 변경이 있는 커밋만)\n')
    for c in hit:
        f.write(f'{c} {m[c]}\n')
PY
git bundle create -q "$OUT/$B" HEAD main
git bundle verify -q "$OUT/$B" >/dev/null 2>&1 || { echo "번들 검증 실패" >&2; exit 1; }
cd "$H"
git clone -q "$OUT/$B" ck
[ "$(git -C ck rev-parse HEAD)" = "$NEW" ] || { echo "clone 결과 HEAD 불일치" >&2; exit 1; }

cat > "$OUT/README-IMPORT.md" <<EOF
# 웹·WPF Git 히스토리 번들

- 파일: \`$B\` (브랜치 main, 커밋 ${COUNT}개)
- 범위: \`zero-rule-web\`, \`popup-frameWork\` (MockSso·Popup.slnx·Popup.BehaviorTests·Popup.RecoveryTests·데모 미디어 제외)
- 정리 규칙: RULES $RULES (20261105·20261106 번들과는 커밋 ID가 이어지지 않는다. 그 번들로 만든 clone은 쓰지 않고 이 번들로 새로 시작한다)
- 기준: 개발 저장소 ${BASE:0:7} 시점
- 직전 번들: $( [ "$PREV" != none ] && echo "\`$(basename "$PREV")\` main ${PREV_HEAD:0:7}에서 이어짐(같은 커밋 ID)" || echo "없음(새로 clone)")

## 처음 받을 때

    git bundle verify $B
    git clone $B popup-history

폐쇄망 원본 소스(8-devServer)와는 공통 커밋이 없으므로 그쪽과 pull·merge하지 않는다.
웹·WPF 폴더(2·3)를 이 이력에 연결하려면 clone 폴더에서 폴더별 브랜치를 만든다.

    cd popup-history
    git subtree split --prefix=zero-rule-web   -b web-only
    git subtree split --prefix=popup-frameWork -b fw-only

연결할 폴더에서(파일은 덮어쓰지 않는다. \`git status\`가 현재 폴더와 번들의 차이다)

    git init
    git remote add origin <popup-history 경로>
    git fetch origin web-only        # WPF 폴더는 fw-only
    git reset origin/web-only

## 다음 번들을 받을 때

    cd popup-history
    git bundle verify <새 번들>
    git pull <새 번들> main
    git subtree split --prefix=zero-rule-web   -b web-only
    git subtree split --prefix=popup-frameWork -b fw-only

그다음 연결한 폴더에서 \`git pull origin web-only\`(WPF는 \`fw-only\`).
연결한 폴더에서 \`git reset --hard\`·\`git checkout .\`·\`git restore .\`는 쓰지 않는다(아래 치환 값과 폐쇄망 수정 내용이 덮어써진다).

## 정리 내용

- 작성자·커미터: \`ok-sy <ok-sy@offline.local>\`로 통일
- 커밋 메시지: Co-Authored-By·생성 도구 표기 제거
- 개발 DB IP: \`<DEV-HOST>\`로 치환 (\`zero-rule-web/Dockerfile\`, \`zero-rule-web/_build-docker-dev.sh\`의 최신 내용도 해당 표기)
- 관리자 웹 값: \`main/src/auth/authentication.ts\`의 암호화 키를 \`<REDACTED>\`로, \`LoginForm.tsx\`의 기본 비밀번호를 빈 값으로 치환 (전체 이력 적용). 연결한 폴더에서는 이 두 파일이 수정됨으로 보이므로 커밋하지 말고 \`git update-index --skip-worktree <파일>\`로 둔다.
- WPF 데모 미디어 \`popup-frameWork/Popup/Media/\`(영상·이미지): 용량(영상이 번들의 약 70%) 때문에 이력에서 제외. 파일은 3-popup-frameWork.tar로 전달되고 \`popup-frameWork/.gitignore\`로 무시되므로 연결한 폴더에서는 변경으로 보이지 않는다. 미디어를 바꿀 때도 반입 패키지로 전달한다.
- 프로토타입 등록 화면 \`features/RgstPop\`의 이력도 들어 있지만 폐쇄망 소스에는 반입하지 않는다(연결한 폴더에서는 삭제됨으로 보인다).
- 커밋 ID가 원본과 다르다. 대응은 \`COMMIT-MAP.txt\` 참조.
EOF
cd "$OUT"
sha256sum "$B" COMMIT-MAP.txt README-IMPORT.md RULES.txt > SHA256SUMS.txt
echo "생성: $OUT ($(stat -c %s "$B") bytes)"
rm -rf "$H"
