param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [int]$TimeoutMinutes = 20
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $RepoRoot

function Get-PnpmCommand {
  $command = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
  if (-not $command) {
    $command = Get-Command pnpm -ErrorAction SilentlyContinue
  }
  if (-not $command) {
    throw "pnpm was not found on PATH."
  }
  return $command.Source
}

function Stop-ProcessTree {
  param([int]$ProcessId)

  taskkill.exe /PID $ProcessId /T /F | Out-Null
}

function Invoke-PnpmRun {
  param(
    [string]$PnpmPath,
    [int]$TimeoutMinutes
  )

  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $env:ComSpec
  if (-not $startInfo.FileName) {
    $startInfo.FileName = "cmd.exe"
  }
  $startInfo.Arguments = "/d /c `"`"$PnpmPath`" run run`""
  $startInfo.WorkingDirectory = $RepoRoot
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $startInfo

  [void]$process.Start()
  $stdout = $process.StandardOutput.ReadToEndAsync()
  $stderr = $process.StandardError.ReadToEndAsync()

  $completed = $process.WaitForExit($TimeoutMinutes * 60 * 1000)
  if (-not $completed) {
    Stop-ProcessTree -ProcessId $process.Id
    throw "pnpm run run exceeded $TimeoutMinutes minutes and was stopped."
  }

  $stdout.Wait()
  $stderr.Wait()

  if ($stdout.Result) {
    [Console]::Out.WriteLine($stdout.Result.TrimEnd())
  }
  if ($stderr.Result) {
    [Console]::Error.WriteLine($stderr.Result.TrimEnd())
  }

  return [int]$process.ExitCode
}

$logDir = Join-Path $RepoRoot "logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "riqd-run-$stamp.log"

Start-Transcript -Path $logPath -Append | Out-Null
try {
  $env:HEADLESS = "true"
  $pnpm = Get-PnpmCommand
  $exitCode = Invoke-PnpmRun -PnpmPath $pnpm -TimeoutMinutes $TimeoutMinutes
  if ($exitCode -ne 0) {
    throw "pnpm run run failed with exit code $exitCode."
  }
} finally {
  Stop-Transcript | Out-Null
}
