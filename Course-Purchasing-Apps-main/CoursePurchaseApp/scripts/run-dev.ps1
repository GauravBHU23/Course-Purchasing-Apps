$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendScript = Join-Path $ScriptDir "run-backend.ps1"
$FrontendScript = Join-Path $ScriptDir "run-frontend.ps1"
$BackendPort = 8000
$BackendHealthUrl = "http://localhost:$BackendPort/health"

function Start-ScriptWindow($title, $scriptPath) {
  Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", "`$Host.UI.RawUI.WindowTitle = '$title'; & '$scriptPath'"
  ) -WindowStyle Normal -PassThru
}

function Wait-ForBackendHealth([string]$Url, [int]$TimeoutSeconds = 60) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -eq 200) {
        return $true
      }
    }
    catch {
      Start-Sleep -Seconds 2
    }
  }
  return $false
}

Write-Host "Starting backend and frontend in separate PowerShell windows..." -ForegroundColor Cyan
$backend = Start-ScriptWindow -title "CoursePurchase Backend" -scriptPath $BackendScript

Write-Host "Waiting for backend health check at $BackendHealthUrl ..." -ForegroundColor Yellow
if (-not (Wait-ForBackendHealth -Url $BackendHealthUrl)) {
  throw "Backend did not become healthy at $BackendHealthUrl. Check the backend window logs and rerun the script."
}

$frontend = Start-ScriptWindow -title "CoursePurchase Frontend" -scriptPath $FrontendScript

Write-Host "Backend process id: $($backend.Id)" -ForegroundColor Green
Write-Host "Frontend process id: $($frontend.Id)" -ForegroundColor Green
Write-Host "Backend:  http://localhost:$BackendPort" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Use the opened windows to watch logs and stop the services." -ForegroundColor Yellow
