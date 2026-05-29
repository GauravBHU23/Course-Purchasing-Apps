$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"
$BackendEnv = Join-Path $BackendDir ".env"
$BackendEnvExample = Join-Path $BackendDir ".env.example"
$VenvDir = Join-Path $BackendDir ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$DepsMarker = Join-Path $VenvDir ".deps-installed"
$BackendPort = 8000

function Write-Step($message) {
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Get-BootstrapPython {
  if (Get-Command py -ErrorAction SilentlyContinue) {
    return @("py", "-3")
  }
  if (Get-Command python -ErrorAction SilentlyContinue) {
    return @("python")
  }
  throw "Python 3.12+ is required. Install Python and try again."
}

function Ensure-EnvFile {
  if (-not (Test-Path $BackendEnv)) {
    Copy-Item $BackendEnvExample $BackendEnv
    Write-Host "Created backend/.env from .env.example" -ForegroundColor Yellow
  }
}

function Ensure-Venv {
  if (Test-Path $VenvPython) {
    return
  }

  Write-Step "Creating backend virtual environment"
  $bootstrap = Get-BootstrapPython
  & $bootstrap[0] $bootstrap[1..($bootstrap.Length - 1)] -m venv $VenvDir
}

function Ensure-Dependencies {
  if (Test-Path $DepsMarker) {
    return
  }

  Write-Step "Installing backend dependencies"
  & $VenvPython -m pip install --upgrade pip
  & $VenvPython -m pip install -r (Join-Path $BackendDir "requirements.txt")
  New-Item -ItemType File -Path $DepsMarker -Force | Out-Null
}

function Get-ListeningProcessIds([int]$Port) {
  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) {
    return @()
  }
  return @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
}

function Wait-ForPortToClose([int]$Port, [int]$TimeoutSeconds = 15) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if ((Get-ListeningProcessIds -Port $Port).Count -eq 0) {
      return
    }
    Start-Sleep -Milliseconds 500
  }
  throw "Port $Port is still in use after stopping the previous backend process."
}

function Stop-StaleBackend([int]$Port) {
  $existingPids = @(Get-ListeningProcessIds -Port $Port | Where-Object { $_ -ne $PID })
  if ($existingPids.Count -eq 0) {
    return
  }

  foreach ($existingPid in $existingPids) {
    $process = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if (-not $process) {
      continue
    }

    if ($process.ProcessName -notin @("python", "pythonw", "py")) {
      throw "Port $Port is already in use by '$($process.ProcessName)' (PID $existingPid). Stop that process and run the script again."
    }

    Write-Step "Stopping existing Python process on port $Port (PID $existingPid)"
    Stop-Process -Id $existingPid -Force
  }

  Wait-ForPortToClose -Port $Port
}

function Show-BackendRuntime {
  Write-Step "Backend runtime"
  Write-Host "Python: $VenvPython" -ForegroundColor Yellow
  & $VenvPython -c "from app.core.config import get_settings; s = get_settings(); print('Instamojo mode:', 'TEST' if s.instamojo_test_mode else 'LIVE'); print('Instamojo base URL:', s.instamojo_base_url); print('Backend URL:', s.backend_url)"
}

Push-Location $BackendDir
try {
  Ensure-EnvFile
  Ensure-Venv
  Ensure-Dependencies
  Stop-StaleBackend -Port $BackendPort

  Write-Step "Running database migrations"
  & $VenvPython -m alembic upgrade head

  Write-Step "Seeding starter data"
  & $VenvPython -m app.db.seed

  Show-BackendRuntime

  Write-Step "Starting backend at http://localhost:$BackendPort"
  & $VenvPython -m uvicorn app.main:app --host 0.0.0.0 --port $BackendPort
}
finally {
  Pop-Location
}
