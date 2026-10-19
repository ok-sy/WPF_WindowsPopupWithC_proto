# 원격 개발 DB(192.168.114.71 XE, 앱 계정 zero-rule = 방식 B, 스키마 접두어 "")에 db/oracle 이관 스크립트 1개를 실행한다.
# 비밀번호는 zero-rule-server/app/src/main/resources/application-dev_db.yml의 주석 줄(#password:)에서 읽고 화면에 출력하지 않는다.
# 사용: powershell -NoProfile -File db\oracle\tools\apply-dev-db.ps1 17_question_rich_text_oracle.sql
param([Parameter(Mandatory = $true)][string]$Script)

$ErrorActionPreference = 'Stop'
$oracleDir = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent (Split-Path -Parent $oracleDir)
# 이관 스크립트 이름만 받는다(경로·다른 파일 실행 방지).
if ($Script -notmatch '^\d{2}_[A-Za-z0-9_]+_oracle\.sql$' -or -not (Test-Path (Join-Path $oracleDir $Script))) {
    throw "db/oracle 아래의 NN_*_oracle.sql 이름만 받습니다: $Script"
}
$config = Join-Path $repoRoot 'zero-rule-server\app\src\main\resources\application-dev_db.yml'
$line = (Select-String -Path $config -Pattern '#password:' | Select-Object -First 1).Line
if (-not $line) { throw "개발 DB 비밀번호 줄을 찾지 못했습니다: $config" }
$password = ($line -split 'password:\s*', 2)[1].Trim().Trim('"').Trim("'")

$env:NLS_LANG = 'KOREAN_KOREA.AL32UTF8'   # 한글 주석의 따옴표가 깨지면 ORA-01756
Push-Location $oracleDir
try {
    # 스키마 접두어(&1)는 빈 값이다. PowerShell 5.1은 빈 인자를 네이티브 프로그램에 그대로 넘기지 못하고,
    # 파이프 입력은 BOM이 붙어 첫 줄을 sqlplus가 알아보지 못한다(SP2-0734). 그래서 1을 빈 값으로 정의하고 스크립트를
    # 부르는 임시 래퍼를 BOM 없이 만들어 실행한다(스크립트 끝의 EXIT로 종료).
    $wrapper = Join-Path $oracleDir ("_apply-dev-db-" + [guid]::NewGuid().ToString('N') + '.sql')
    [System.IO.File]::WriteAllText($wrapper, "DEFINE 1 = ''`r`n@$Script`r`n", (New-Object System.Text.UTF8Encoding $false))
    try {
        & sqlplus -S "zero-rule/$password@//192.168.114.71:4004/XE" "@$(Split-Path -Leaf $wrapper)"
    } finally {
        Remove-Item -LiteralPath $wrapper -Force -ErrorAction SilentlyContinue
    }
    if ($LASTEXITCODE -ne 0) { throw "sqlplus 실패 (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}
