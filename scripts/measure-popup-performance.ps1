# Windows PowerShell 5.1 / PowerShell 7, 외부 패키지 없이 실행
[CmdletBinding()]
param(
    [int]$PopupProcessId = 0,
    [ValidateSet('idle','playing','paused','dragging','dpi-move','fullscreen')]
    [string]$Phase = 'playing',
    [ValidateRange(2,3600)][int]$DurationSeconds = 60,
    [ValidateRange(1,10)][int]$IntervalSeconds = 2,
    [string]$OutputDirectory = (Join-Path $env:TEMP 'PopupPerformance')
)
$ErrorActionPreference = 'Stop'
if ($PopupProcessId -eq 0) {
    $candidates = @(Get-Process -Name popupSample -ErrorAction SilentlyContinue)
    if ($candidates.Count -ne 1) { throw 'popupSample을 하나만 실행하거나 -PopupProcessId로 대상 PID를 지정하세요.' }
    $PopupProcessId = $candidates[0].Id
}
$rootProcess = Get-Process -Id $PopupProcessId
$rootStart = $rootProcess.StartTime.ToUniversalTime().Ticks
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$prefix = Join-Path $OutputDirectory "$stamp-$Phase-$PopupProcessId"
$computer = Get-CimInstance Win32_ComputerSystem
$processors = @(Get-CimInstance Win32_Processor)
$os = Get-CimInstance Win32_OperatingSystem
$logicalCount = [int]$computer.NumberOfLogicalProcessors
$metadata = [ordered]@{
    startedAt = (Get-Date).ToString('o'); phase = $Phase; processId = $PopupProcessId
    executable = $rootProcess.Path; logicalProcessors = $logicalCount
    cpu = @($processors | ForEach-Object { $_.Name }); memoryGB = [math]::Round($computer.TotalPhysicalMemory / 1GB, 2)
    os = $os.Caption; osVersion = $os.Version; session = $env:SESSIONNAME
    requestedDurationSeconds = $DurationSeconds; intervalSeconds = $IntervalSeconds
    cpuBasis = '전체 논리 CPU 용량을 100%로 계산. rootCpuPercent는 앱 본체, treeCpuPercent는 자손 프로세스 포함.'
    limitations = '외부 측정 도구. UI 지연·화면 품질·시스템 전체 CPU는 측정하지 않음. 짧게 실행된 프로세스의 CPU는 누락될 수 있음.'
}
# CPU差分はPIDと開始時刻の組で管理し、PID再利用を別プロセスとして扱う。
$previous = @{}
$samples = [System.Collections.Generic.List[object]]::new()
$timer = [Diagnostics.Stopwatch]::StartNew()
$lastTime = 0.0
Write-Host "[$Phase] ${DurationSeconds}초 측정. 대상 동작을 계속하세요. PID=$PopupProcessId"
while ($true) {
    $currentRoot = Get-Process -Id $PopupProcessId -ErrorAction SilentlyContinue
    if (!$currentRoot -or $currentRoot.StartTime.ToUniversalTime().Ticks -ne $rootStart) { break }
    # WebView2等の子孫だけを集計し、他アプリのブラウザを混ぜない。
    $all = @(Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId)
    $ids = [System.Collections.Generic.HashSet[int]]::new()
    [void]$ids.Add($PopupProcessId)
    do {
        $added = $false
        foreach ($entry in $all) {
            if ($ids.Contains([int]$entry.ParentProcessId) -and $ids.Add([int]$entry.ProcessId)) { $added = $true }
        }
    } while ($added)
    $now = $timer.Elapsed.TotalSeconds
    $elapsed = $now - $lastTime
    $next = @{}; $rootDelta = 0.0; $treeDelta = 0.0; $working = 0L; $private = 0L; $count = 0
    foreach ($processNumber in $ids) {
        $process = Get-Process -Id $processNumber -ErrorAction SilentlyContinue
        if (!$process) { continue }
        try {
            $key = '{0}:{1}' -f $process.Id, $process.StartTime.ToUniversalTime().Ticks
            $cpu = $process.TotalProcessorTime.TotalSeconds
            $next[$key] = $cpu
            if ($previous.ContainsKey($key)) {
                $delta = [math]::Max(0, $cpu - $previous[$key])
                $treeDelta += $delta
                if ($process.Id -eq $PopupProcessId) { $rootDelta += $delta }
            }
            $working += $process.WorkingSet64; $private += $process.PrivateMemorySize64; $count++
        } catch { continue } # 샘플 수집 중 프로세스 종료
    }
    if ($previous.Count -gt 0 -and $elapsed -gt 0) {
        $samples.Add([pscustomobject]@{
            timestamp = (Get-Date).ToString('o'); phase = $Phase
            elapsedSeconds = [math]::Round($now,3); sampleSeconds = [math]::Round($elapsed,3)
            rootCpuPercent = [math]::Round(100 * $rootDelta / $elapsed / $logicalCount,2)
            treeCpuPercent = [math]::Round(100 * $treeDelta / $elapsed / $logicalCount,2)
            treeWorkingSetMB = [math]::Round($working / 1MB,2)
            treePrivateMB = [math]::Round($private / 1MB,2); processCount = $count
        })
    }
    $previous = $next; $lastTime = $now
    if ($now -ge $DurationSeconds) { break }
    Start-Sleep -Milliseconds ([int](1000 * [math]::Min($IntervalSeconds, $DurationSeconds - $now)))
}
$timer.Stop()
$metadata['actualDurationSeconds'] = [math]::Round($timer.Elapsed.TotalSeconds,3)
$metadata['sampleCount'] = $samples.Count
$metadata | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath "$prefix-environment.json" -Encoding UTF8
if ($samples.Count -eq 0) { throw "측정 샘플이 없습니다. 대상 프로세스를 확인하세요. 환경 정보: $prefix-environment.json" }
$samples | Export-Csv -LiteralPath "$prefix-samples.csv" -NoTypeInformation -Encoding UTF8
$totalSeconds = ($samples | Measure-Object sampleSeconds -Sum).Sum
$summary = [ordered]@{ phase = $Phase; sampleCount = $samples.Count }
foreach ($metric in @('rootCpuPercent','treeCpuPercent')) {
    $weighted = 0.0
    foreach ($sample in $samples) { $weighted += $sample.$metric * $sample.sampleSeconds }
    $summary["${metric}Average"] = [math]::Round($weighted / $totalSeconds,2)
    $summary["${metric}Max"] = ($samples | Measure-Object $metric -Maximum).Maximum
}
$summary['treeWorkingSetMBPeak'] = ($samples | Measure-Object treeWorkingSetMB -Maximum).Maximum
$summary['treePrivateMBPeak'] = ($samples | Measure-Object treePrivateMB -Maximum).Maximum
$summary | ConvertTo-Json | Set-Content -LiteralPath "$prefix-summary.json" -Encoding UTF8
$summary | Format-List | Out-Host
Write-Host "결과: $prefix-samples.csv / -summary.json / -environment.json"
