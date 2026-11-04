# [설계 50 S1] 개발 DB 비밀번호를 Git 제외 파일 shell/dev-db.local.env(KEY=VALUE)에서 현재 세션 환경변수로 읽는다.
# 이미 설정된 환경변수가 우선하며 값은 출력하지 않는다. 파일이 없으면 아무것도 하지 않는다.
function Import-DevDbEnv {
    $file = Join-Path $PSScriptRoot 'dev-db.local.env'
    if (-not (Test-Path -LiteralPath $file)) { return }
    foreach ($line in [System.IO.File]::ReadAllLines($file)) {
        if ($line -match '^\s*(#|$)') { continue }
        $name, $value = $line -split '=', 2
        $name = $name.Trim()
        if ($null -eq $value -or $name -notmatch '^[A-Z_][A-Z0-9_]*$') { continue }
        if ([string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($name))) {
            [Environment]::SetEnvironmentVariable($name, $value.Trim(), 'Process')
        }
    }
}
