$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $RootDir "frontend"
$FrontendEnv = Join-Path $FrontendDir ".env.local"
$NodeModulesDir = Join-Path $FrontendDir "node_modules"

function Write-Step($message) {
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Ensure-Npm {
  if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw "Node.js 22+ with npm is required. Install Node.js and try again."
  }
}

function Ensure-FrontendEnv {
  $content = "NEXT_PUBLIC_BACKEND_URL=https://inn-circulation-rising-observations.trycloudflare.com`r`n"
  Set-Content -Path $FrontendEnv -Value $content -Encoding ascii
}

Push-Location $FrontendDir
try {
  Ensure-Npm
  Ensure-FrontendEnv

  if (-not (Test-Path $NodeModulesDir)) {
    Write-Step "Installing frontend dependencies"
    & npm.cmd install
  }

  Write-Step "Starting frontend at http://localhost:3000"
  & npm.cmd run dev
}
finally {
  Pop-Location
}
