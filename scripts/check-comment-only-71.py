"""POL-16-02 : 재현 가능한 검증
■ 주석만 바뀌었는지 검사(TODO71 주석 정리용)
사용: python scripts/check-comment-only-71.py <repo-root> <파일...>   (파일은 repo 기준 상대 경로)
지원: .cs .java .ts .tsx .js .cjs .mjs (// /* */ + 문자열·문자·템플릿·C# verbatim/raw·Java text block 보호),
      .xml .xaml .csproj .props (<!-- -->), .sql (-- /* */, '문자열' 보호), .py (# , 문자열 보호), .yml .yaml .properties (#).
비교는 주석 제거 후 모든 공백 제거한 문자열 일치 여부다(줄바꿈·들여쓰기 차이는 무시). --strict는 줄 안 공백 차이까지 본다."""
import subprocess, sys, os, re

def strip_c_like(s, kind):
    out = []; i = 0; n = len(s)
    while i < n:
        c = s[i]; two = s[i:i+2]
        if two == '//':
            j = s.find('\n', i); i = n if j < 0 else j; continue
        if two == '/*':
            j = s.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if kind in ('java', 'cs') and s.startswith('"""', i):
            j = s.find('"""', i + 3)
            while j >= 0 and kind == 'cs' and s.startswith('""""', j): j += 1
            j = n if j < 0 else j + 3; out.append(s[i:j]); i = j; continue
        if kind == 'cs' and (s.startswith('@"', i) or s.startswith('$@"', i) or s.startswith('@$"', i)):
            k = s.index('"', i) + 1
            while k < n:
                if s[k] == '"':
                    if k + 1 < n and s[k+1] == '"': k += 2; continue
                    break
                k += 1
            out.append(s[i:k+1]); i = k + 1; continue
        if c in '"\'' or (c == '`' and kind == 'ts'):
            q = c; k = i + 1
            while k < n and s[k] != q:
                if s[k] == '\\': k += 2; continue
                if q != '`' and s[k] == '\n': break
                k += 1
            out.append(s[i:k+1]); i = k + 1; continue
        out.append(c); i += 1
    return ''.join(out)

def strip_sql(s):
    out = []; i = 0; n = len(s)
    while i < n:
        if s.startswith('--', i):
            j = s.find('\n', i); i = n if j < 0 else j; continue
        if s.startswith('/*', i):
            j = s.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if s[i] == "'":
            k = i + 1
            while k < n:
                if s[k] == "'":
                    if k + 1 < n and s[k+1] == "'": k += 2; continue
                    break
                k += 1
            out.append(s[i:k+1]); i = k + 1; continue
        out.append(s[i]); i += 1
    return ''.join(out)

def strip_hash(s):
    out = []
    for line in s.split('\n'):
        res = []; q = None; k = 0
        while k < len(line):
            ch = line[k]
            if q:
                res.append(ch)
                if ch == '\\': res.append(line[k+1:k+2]); k += 2; continue
                if ch == q: q = None
            elif ch in '"\'': q = ch; res.append(ch)
            elif ch == '#': break
            else: res.append(ch)
            k += 1
        out.append(''.join(res))
    return '\n'.join(out)

def normalize(path, text):
    ext = os.path.splitext(path)[1].lower()
    if ext in ('.cs',): t = strip_c_like(text, 'cs')
    elif ext in ('.java',): t = strip_c_like(text, 'java')
    elif ext in ('.ts', '.tsx', '.js', '.cjs', '.mjs', '.kts', '.gradle'): t = strip_c_like(text, 'ts')
    elif ext in ('.xml', '.xaml', '.csproj', '.props', '.targets', '.html'): t = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    elif ext == '.sql': t = strip_sql(text)
    elif ext in ('.py', '.yml', '.yaml', '.properties', '.ps1', '.sh'): t = strip_hash(text)
    else: t = text
    if STRICT:
        # 엄격 모드: 줄 안 공백 차이(예: "a = (" ↔ "a =(")도 잡는다. 줄 앞뒤 공백·빈 줄·연속 공백만 무시한다.
        lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in t.replace('\r\n', '\n').split('\n')]
        return '\n'.join(line for line in lines if line)
    return re.sub(r'\s+', '', t)

args = sys.argv[1:]
STRICT = '--strict' in args
args = [a for a in args if a != '--strict']
repo = args[0]; bad = 0
for f in args[1:]:
    try:
        before = subprocess.run(['git', 'show', f'HEAD:{f}'], cwd=repo, capture_output=True, check=True).stdout.decode('utf-8-sig', 'replace')
    except subprocess.CalledProcessError:
        print('NEW ', f); continue
    after = open(os.path.join(repo, f), 'rb').read().decode('utf-8-sig', 'replace')
    if normalize(f, before) == normalize(f, after): print('OK  ', f)
    else: bad += 1; print('DIFF', f)
sys.exit(1 if bad else 0)
