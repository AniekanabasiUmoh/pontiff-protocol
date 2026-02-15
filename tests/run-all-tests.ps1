##############################################
# PONTIFF: Master Test Runner
# Runs all audit test scripts in sequence
#
# Usage: .\tests\run-all-tests.ps1
##############################################

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   THE PONTIFF - FULL AUDIT TEST SUITE" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Cyan
Write-Host "  1. Next.js dev server running on port 3000" -ForegroundColor Gray
Write-Host "  2. Monad testnet RPC accessible" -ForegroundColor Gray
Write-Host "  3. Supabase connected" -ForegroundColor Gray
Write-Host ""

$totalPassed = 0
$totalFailed = 0
$testResults = @()

function Run-TestSuite {
    param (
        [string]$Name,
        [string]$Script
    )

    Write-Host "Running: $Name..." -ForegroundColor Cyan

    try {
        $output = & npx tsx $Script 2>&1
        $exitCode = $LASTEXITCODE

        $output | ForEach-Object { Write-Host $_ }

        if ($exitCode -eq 0) {
            Write-Host "  Result: PASSED" -ForegroundColor Green
            $script:totalPassed++
            $script:testResults += [PSCustomObject]@{ Suite = $Name; Result = "PASSED" }
        } else {
            Write-Host "  Result: FAILED" -ForegroundColor Red
            $script:totalFailed++
            $script:testResults += [PSCustomObject]@{ Suite = $Name; Result = "FAILED" }
        }
    }
    catch {
        Write-Host "  Result: ERROR - $_" -ForegroundColor Red
        $script:totalFailed++
        $script:testResults += [PSCustomObject]@{ Suite = $Name; Result = "ERROR" }
    }

    Write-Host ""
}

# ── Run Test Suites ──

# 1. On-chain tests (no server needed)
Run-TestSuite -Name "Smart Contracts (On-Chain)" -Script "tests/test-all-contracts.ts"
Run-TestSuite -Name "Staking Cathedral (On-Chain)" -Script "tests/test-staking-cathedral.ts"
Run-TestSuite -Name "Judas Protocol (On-Chain)" -Script "tests/test-judas-protocol.ts"

# 2. API tests (server required)
Run-TestSuite -Name "All API Routes (Smoke Test)" -Script "tests/test-all-api-routes.ts"
Run-TestSuite -Name "Confession Flow" -Script "tests/test-confession-flow.ts"
Run-TestSuite -Name "RPS Game" -Script "tests/test-rps-game.ts"
Run-TestSuite -Name "Agent System" -Script "tests/test-agent-system.ts"

# ── Grand Summary ──
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   GRAND SUMMARY" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

$testResults | ForEach-Object {
    $color = if ($_.Result -eq "PASSED") { "Green" } else { "Red" }
    Write-Host "  $($_.Result.PadRight(8)) $($_.Suite)" -ForegroundColor $color
}

Write-Host ""
Write-Host "  Suites Passed: $totalPassed" -ForegroundColor Green
Write-Host "  Suites Failed: $totalFailed" -ForegroundColor $(if ($totalFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow

if ($totalFailed -gt 0) {
    exit 1
}
