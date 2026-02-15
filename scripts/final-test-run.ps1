# Final Test Run - Complete Fix Cycle
# This restarts the server and runs tests

param([switch]$SkipServerRestart)

Write-Host "`n=== PONTIFF FINAL TEST CYCLE ===" -ForegroundColor Cyan

if (-not $SkipServerRestart) {
    Write-Host "`n1. Stopping any existing dev servers..." -ForegroundColor Yellow

    # Kill any existing Next.js processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*node*" -or $_.CommandLine -like "*next*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue

    Write-Host "   Waiting 3 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 3

    Write-Host "`n2. Starting dev server in background..." -ForegroundColor Yellow
    Write-Host "   Command: npm run dev" -ForegroundColor Gray

    # Start dev server in background
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory (Get-Location) -WindowStyle Hidden

    Write-Host "   Waiting 15 seconds for server to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 15

    # Check if server is up
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   Server is UP and running!" -ForegroundColor Green
    } catch {
        Write-Host "   WARNING: Server may not be fully ready" -ForegroundColor Yellow
        Write-Host "   Waiting additional 10 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
}

Write-Host "`n3. Running API tests..." -ForegroundColor Yellow

# Run tests
.\scripts\test-api.ps1

Write-Host "`n=== DONE ===" -ForegroundColor Cyan
